use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{ephemeral, DelegationProgram};
use ephemeral_rollups_sdk::cpi::{delegate_account, DelegateAccounts, DelegateConfig};
use ephemeral_rollups_sdk::ephem::commit_and_undelegate_accounts;

declare_id!("Ek8THkUVr8oVsQkXcsWtSCaA9Eg9WAyjG44t4CumLhJg");

// ─── Constants ────────────────────────────────────────────────────────────────

/// Max size of an encrypted tip blob (client-side encrypted with box owner pubkey)
pub const MAX_BLOB_SIZE: usize = 4096;
/// Max number of submissions stored per box (demo cap — expandable)
pub const MAX_SUBMISSIONS: usize = 50;

// ─── Program ─────────────────────────────────────────────────────────────────

#[ephemeral]
#[program]
pub mod whisper_hunt_per {
    use super::*;

    /// Creates permission groups for a given box.
    /// Registers the box_owner (who can read & approve) and
    /// an optional verifier (who can confirm tip authenticity).
    ///
    /// This is called AFTER the box is created on L1.
    /// `box_id` corresponds to the BountyBox account pubkey on L1.
    pub fn create_box_permissions(
        ctx: Context<CreateBoxPermissions>,
        box_id: Pubkey,
        verifier_pubkey: Pubkey,
    ) -> Result<()> {
        let permissions = &mut ctx.accounts.box_permissions;
        permissions.box_id = box_id;
        permissions.owner = ctx.accounts.owner.key();
        permissions.verifier = verifier_pubkey;
        permissions.submission_count = 0;
        permissions.is_settled = false;
        permissions.bump = ctx.bumps.box_permissions;

        let submission = &mut ctx.accounts.submission;
        submission.box_id = box_id;
        submission.submission_id = 0;
        submission.submitter = Pubkey::default();
        submission.encrypted_blob = vec![];
        submission.timestamp = 0;
        submission.is_approved = false;
        submission.bump = ctx.bumps.submission;

        emit!(PermissionsCreated {
            box_id,
            owner: ctx.accounts.owner.key(),
            verifier: verifier_pubkey,
        });

        Ok(())
    }

    /// Delegates BOTH the BoxPermissions and Submission accounts to the MagicBlock ER
    pub fn delegate_box_permissions(ctx: Context<DelegatePermissions>, box_id: Pubkey) -> Result<()> {
        let bp_seeds: &[&[u8]] = &[&b"box_permissions"[..], box_id.as_ref()];
        let bp_accounts = DelegateAccounts {
            payer: &ctx.accounts.payer.to_account_info(),
            pda: &ctx.accounts.box_permissions.to_account_info(),
            owner_program: &ctx.accounts.owner_program.to_account_info(),
            buffer: &ctx.accounts.bp_buffer.to_account_info(),
            delegation_record: &ctx.accounts.bp_delegation_record.to_account_info(),
            delegation_metadata: &ctx.accounts.bp_delegation_metadata.to_account_info(),
            delegation_program: &ctx.accounts.delegation_program.to_account_info(),
            system_program: &ctx.accounts.system_program.to_account_info(),
        };
        delegate_account(bp_accounts, bp_seeds, DelegateConfig::default())?;

        let sub_seeds: &[&[u8]] = &[&b"submission"[..], box_id.as_ref()];
        let sub_accounts = DelegateAccounts {
            payer: &ctx.accounts.payer.to_account_info(),
            pda: &ctx.accounts.submission.to_account_info(),
            owner_program: &ctx.accounts.owner_program.to_account_info(),
            buffer: &ctx.accounts.sub_buffer.to_account_info(),
            delegation_record: &ctx.accounts.sub_delegation_record.to_account_info(),
            delegation_metadata: &ctx.accounts.sub_delegation_metadata.to_account_info(),
            delegation_program: &ctx.accounts.delegation_program.to_account_info(),
            system_program: &ctx.accounts.system_program.to_account_info(),
        };
        delegate_account(sub_accounts, sub_seeds, DelegateConfig::default())?;

        Ok(())
    }

    /// Undelegates BOTH the BoxPermissions and Submission accounts back to the L1 base layer
    pub fn undelegate_state(ctx: Context<UndelegateState>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![
                &ctx.accounts.box_permissions.to_account_info(),
                &ctx.accounts.submission.to_account_info()
            ],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    /// Stores a privately encrypted tip blob.
    ///
    /// `encrypted_blob` — the raw tip content encrypted CLIENT-SIDE with the
    /// box owner's public key. Even inside the TEE, only the owner holding
    /// the corresponding private key can decrypt it. Double-layer privacy.
    ///
    /// The submitter signs with a session keypair, so their persistent wallet
    /// never appears on any public chain state.
    pub fn submit_tip(
        ctx: Context<SubmitTip>,
        box_id: Pubkey,
        encrypted_blob: Vec<u8>,
    ) -> Result<()> {
        require!(
            encrypted_blob.len() <= MAX_BLOB_SIZE,
            PError::BlobTooLarge
        );
        require!(
            !ctx.accounts.box_permissions.is_settled,
            PError::BoxAlreadySettled
        );
        require!(
            ctx.accounts.box_permissions.submission_count < MAX_SUBMISSIONS as u64,
            PError::TooManySubmissions
        );

        let submission = &mut ctx.accounts.submission;
        submission.box_id = box_id;
        submission.submission_id = ctx.accounts.box_permissions.submission_count;
        submission.submitter = ctx.accounts.submitter.key();
        submission.encrypted_blob = encrypted_blob;
        submission.timestamp = Clock::get()?.unix_timestamp;
        submission.is_approved = false;

        ctx.accounts.box_permissions.submission_count += 1;

        emit!(TipSubmitted {
            box_id,
            submission_id: submission.submission_id,
            submitter: submission.submitter,
            timestamp: submission.timestamp,
        });

        Ok(())
    }

    /// Owner-only: approve a submission inside the TEE.
    ///
    /// Authentication happens via auth token (challenge/response, issued by the
    /// TEE's permission program). The TEE validates the token before this IX runs.
    ///
    /// On approval:
    ///   1. Marks the submission + box as settled (no further changes possible)
    ///   2. CPIs into whisper-hunt-l1's `release_bounty` so the vault sends
    ///      all SOL to the winning submitter's pubkey.
    pub fn approve_submission(
        ctx: Context<ApproveSubmission>,
        _submission_id: u64,
    ) -> Result<()> {
        require!(
            ctx.accounts.box_permissions.owner == ctx.accounts.owner.key(),
            PError::Unauthorized
        );
        require!(
            !ctx.accounts.box_permissions.is_settled,
            PError::BoxAlreadySettled
        );
        require!(
            !ctx.accounts.submission.is_approved,
            PError::AlreadyApproved
        );

        let submitter_pubkey = ctx.accounts.submission.submitter;
        ctx.accounts.submission.is_approved = true;
        ctx.accounts.box_permissions.is_settled = true;

        // ── CPI to L1: release the vault bounty ──────────────────────────────
        // Build the `release_bounty` instruction manually with the correct
        // 8-byte Anchor discriminator so we don't need the L1 crate at compile time.
        // The PER program's own PDA ("per_authority") signs this CPI.
        // On L1, `release_bounty` validates that exact PDA — the security
        // guarantee that no other party can trigger a payout.
        let per_authority_seeds: &[&[u8]] = &[b"per_authority", &[ctx.bumps.per_authority]];

        // Instruction data: sha256("global:release_bounty")[0..8] ++ submitter pubkey
        let discriminator = solana_program::hash::hashv(&[b"global:release_bounty"]).to_bytes();
        let mut ix_data = discriminator[..8].to_vec();
        ix_data.extend_from_slice(&submitter_pubkey.to_bytes());

        let ix = anchor_lang::solana_program::instruction::Instruction {
            program_id: *ctx.accounts.l1_program.key,
            accounts: vec![
                anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                    ctx.accounts.per_authority.key(), true,
                ),
                anchor_lang::solana_program::instruction::AccountMeta::new(
                    ctx.accounts.l1_bounty_box.key(), false,
                ),
                anchor_lang::solana_program::instruction::AccountMeta::new(
                    ctx.accounts.l1_vault.key(), false,
                ),
                anchor_lang::solana_program::instruction::AccountMeta::new(
                    ctx.accounts.submitter_wallet.key(), false,
                ),
                anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
                    ctx.accounts.system_program.key(), false,
                ),
            ],
            data: ix_data,
        };

        anchor_lang::solana_program::program::invoke_signed(
            &ix,
            &[
                ctx.accounts.per_authority.to_account_info(),
                ctx.accounts.l1_bounty_box.to_account_info(),
                ctx.accounts.l1_vault.to_account_info(),
                ctx.accounts.submitter_wallet.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[per_authority_seeds],
        )?;

        emit!(SubmissionApproved {
            box_id: ctx.accounts.box_permissions.box_id,
            submission_id: ctx.accounts.submission.submission_id,
            submitter: submitter_pubkey,
        });

        Ok(())
    }
}

// ─── Account Structs ──────────────────────────────────────────────────────────

/// Permission group for one bounty box.
/// Lives entirely inside the TEE — private from Solana L1.
#[account]
#[derive(InitSpace)]
pub struct BoxPermissions {
    pub box_id: Pubkey,
    pub owner: Pubkey,
    pub verifier: Pubkey,
    pub submission_count: u64,
    pub is_settled: bool,
    pub bump: u8,
}

/// A single private tip submission.
/// `encrypted_blob` is client-side encrypted — only the box owner can decrypt.
#[account]
#[derive(InitSpace)]
pub struct Submission {
    pub box_id: Pubkey,
    pub submission_id: u64,
    pub submitter: Pubkey,
    #[max_len(4096)]
    pub encrypted_blob: Vec<u8>,
    pub timestamp: i64,
    pub is_approved: bool,
    pub bump: u8,
}

// ─── Instruction Contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(box_id: Pubkey)]
pub struct CreateBoxPermissions<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + BoxPermissions::INIT_SPACE,
        seeds = [b"box_permissions", box_id.as_ref()],
        bump
    )]
    pub box_permissions: Account<'info, BoxPermissions>,

    #[account(
        init,
        payer = owner,
        space = 8 + Submission::INIT_SPACE,
        seeds = [b"submission", box_id.as_ref()],
        bump
    )]
    pub submission: Account<'info, Submission>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(box_id: Pubkey)]
pub struct DelegatePermissions<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    // ── Box Permissions Delegation Accounts ──
    /// CHECK: Managed by ER
    #[account(mut)]
    pub box_permissions: AccountInfo<'info>,
    /// CHECK: ER Buffer
    #[account(mut)]
    pub bp_buffer: AccountInfo<'info>,
    /// CHECK: Delegation record
    #[account(mut)]
    pub bp_delegation_record: AccountInfo<'info>,
    /// CHECK: Delegation metadata
    #[account(mut)]
    pub bp_delegation_metadata: AccountInfo<'info>,

    // ── Submission Delegation Accounts ──
    /// CHECK: Managed by ER
    #[account(mut)]
    pub submission: AccountInfo<'info>,
    /// CHECK: ER Buffer
    #[account(mut)]
    pub sub_buffer: AccountInfo<'info>,
    /// CHECK: Delegation record
    #[account(mut)]
    pub sub_delegation_record: AccountInfo<'info>,
    /// CHECK: Delegation metadata
    #[account(mut)]
    pub sub_delegation_metadata: AccountInfo<'info>,
    
    pub delegation_program: Program<'info, DelegationProgram>,
    /// CHECK: Owner program
    pub owner_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UndelegateState<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Managed by ER (fails Anchor owner check)
    #[account(mut)]
    pub box_permissions: AccountInfo<'info>,

    /// CHECK: Managed by ER (fails Anchor owner check)
    #[account(mut)]
    pub submission: AccountInfo<'info>,

    /// CHECK: Magic context
    #[account(mut)]
    pub magic_context: AccountInfo<'info>,
    /// CHECK: Magic program
    pub magic_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(box_id: Pubkey)]
pub struct SubmitTip<'info> {
    // Only the zero-balance ephemeral key signs!
    pub submitter: Signer<'info>,

    #[account(
        mut,
        seeds = [b"box_permissions", box_id.as_ref()],
        bump = box_permissions.bump
    )]
    pub box_permissions: Account<'info, BoxPermissions>,

    #[account(
        mut,
        seeds = [b"submission", box_id.as_ref()],
        bump = submission.bump
    )]
    pub submission: Account<'info, Submission>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(submission_id: u64)]
pub struct ApproveSubmission<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = box_permissions.owner == owner.key() @ PError::Unauthorized
    )]
    pub box_permissions: Account<'info, BoxPermissions>,

    #[account(
        mut,
        seeds = [
            b"submission",
            box_permissions.box_id.as_ref(),
        ],
        bump = submission.bump
    )]
    pub submission: Account<'info, Submission>,

    /// The PER program's own authority PDA — used to sign the CPI to L1.
    /// L1's `release_bounty` validates this exact PDA as the only allowed caller.
    #[account(
        seeds = [b"per_authority"],
        bump
    )]
    pub per_authority: SystemAccount<'info>,

    // ── L1 CPI accounts ──────────────────────────────────────────────────────

    /// CHECK: L1 BountyBox account — validated inside L1 program
    #[account(mut)]
    pub l1_bounty_box: UncheckedAccount<'info>,

    /// CHECK: L1 Vault PDA — validated inside L1 program
    #[account(mut)]
    pub l1_vault: UncheckedAccount<'info>,

    /// CHECK: Submitter wallet — payout destination
    #[account(mut)]
    pub submitter_wallet: UncheckedAccount<'info>,

    /// CHECK: The whisper-hunt-l1 program
    pub l1_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct PermissionsCreated {
    pub box_id: Pubkey,
    pub owner: Pubkey,
    pub verifier: Pubkey,
}

#[event]
pub struct TipSubmitted {
    pub box_id: Pubkey,
    pub submission_id: u64,
    pub submitter: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct SubmissionApproved {
    pub box_id: Pubkey,
    pub submission_id: u64,
    pub submitter: Pubkey,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum PError {
    #[msg("Encrypted blob exceeds maximum allowed size (4096 bytes)")]
    BlobTooLarge,
    #[msg("This box has already been settled")]
    BoxAlreadySettled,
    #[msg("Submission limit reached for this box")]
    TooManySubmissions,
    #[msg("Only the box owner can perform this action")]
    Unauthorized,
    #[msg("This submission has already been approved")]
    AlreadyApproved,
}
