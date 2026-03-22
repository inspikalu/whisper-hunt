use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("RSKiBZg1sMV2qUF3tj4gsYYWVm74sKcTAYvLK7F8Msw");

// ─── Constants ───────────────────────────────────────────────────────────────

/// The program ID of whisper-hunt-per running inside the TEE.
/// Only a CPI signed by its PDA can call `release_bounty`.
/// Update this after deploying the PER program.
pub const PER_PROGRAM_ID: &str = "Ek8THkUVr8oVsQkXcsWtSCaA9Eg9WAyjG44t4CumLhJg";

// ─── Program ─────────────────────────────────────────────────────────────────

#[program]
pub mod whisper_hunt_l1 {
    use super::*;

    /// Creates a new bounty box.
    /// The funder sets a topic, deadline, and a verifier pubkey.
    /// An initial SOL deposit is locked into the vault PDA.
    pub fn create_box(
        ctx: Context<CreateBox>,
        nonce: [u8; 4],
        topic: String,
        deadline: i64,
        verifier_pubkey: Pubkey,
        initial_amount: u64,
    ) -> Result<()> {
        require!(topic.len() > 0 && topic.len() <= 200, WError::TopicTooLong);
        require!(initial_amount > 0, WError::ZeroFunding);

        let clock = Clock::get()?;
        require!(deadline > clock.unix_timestamp, WError::DeadlineInPast);

        // Capture the key before the mutable borrow to satisfy the borrow checker
        let box_id = ctx.accounts.bounty_box.key();
        let funder_key = ctx.accounts.funder.key();

        let bounty_box = &mut ctx.accounts.bounty_box;
        bounty_box.funder = funder_key;
        bounty_box.topic = topic;
        bounty_box.deadline = deadline;
        bounty_box.verifier_pubkey = verifier_pubkey;
        bounty_box.total_funded = initial_amount;
        bounty_box.is_settled = false;
        bounty_box.winner = None;
        bounty_box.bump = ctx.bumps.bounty_box;
        bounty_box.vault_bump = ctx.bumps.vault;
        bounty_box.box_id = box_id;
        let topic_clone = bounty_box.topic.clone();

        // Transfer initial SOL into vault
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            initial_amount,
        )?;

        emit!(BoxCreated {
            box_id,
            funder: funder_key,
            topic: topic_clone,
            deadline,
            verifier_pubkey,
            initial_amount,
        });

        Ok(())
    }

    /// Anyone can add more SOL to an existing box — making it a crowd-funded pool.
    pub fn fund_box(ctx: Context<FundBox>, amount: u64) -> Result<()> {
        require!(amount > 0, WError::ZeroFunding);
        require!(!ctx.accounts.bounty_box.is_settled, WError::AlreadySettled);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < ctx.accounts.bounty_box.deadline,
            WError::DeadlinePassed
        );

        ctx.accounts.bounty_box.total_funded = ctx
            .accounts
            .bounty_box
            .total_funded
            .checked_add(amount)
            .ok_or(WError::Overflow)?;

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(BoxFunded {
            box_id: ctx.accounts.bounty_box.key(),
            funder: ctx.accounts.funder.key(),
            amount,
            new_total: ctx.accounts.bounty_box.total_funded,
        });

        Ok(())
    }

    /// Original funder reclaims SOL if the deadline passes without any approval.
    pub fn close_box(ctx: Context<CloseBox>) -> Result<()> {
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= ctx.accounts.bounty_box.deadline,
            WError::DeadlineNotPassed
        );
        require!(!ctx.accounts.bounty_box.is_settled, WError::AlreadySettled);

        let box_id = ctx.accounts.bounty_box.key();
        let bump = ctx.accounts.bounty_box.vault_bump;
        let vault_seeds = &[
            b"vault",
            box_id.as_ref(),
            &[bump]
        ];
        let signer = &[&vault_seeds[..]];

        let vault_balance = ctx.accounts.vault.lamports();

        // Transfer all vault lamports back to funder via CPI signed by the PDA
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.funder.to_account_info(),
                },
                signer,
            ),
            vault_balance,
        )?;

        ctx.accounts.bounty_box.is_settled = true;

        emit!(BoxClosed {
            box_id,
            funder: ctx.accounts.bounty_box.funder,
            refund_amount: vault_balance,
        });

        Ok(())
    }

    /// Releases the bounty to the winner.
    /// CRITICAL: This instruction must only be called via CPI from the PER program.
    /// The constraint enforces the per_program is the correct program — nobody else can trigger a payout.
    pub fn release_bounty(ctx: Context<ReleaseBounty>, submitter: Pubkey) -> Result<()> {
        require!(!ctx.accounts.bounty_box.is_settled, WError::AlreadySettled);

        let box_id = ctx.accounts.bounty_box.key();
        let vault_balance = ctx.accounts.vault.lamports();
        require!(vault_balance > 0, WError::EmptyVault);

        let bump = ctx.accounts.bounty_box.vault_bump;
        let vault_seeds = &[
            b"vault",
            box_id.as_ref(),
            &[bump]
        ];
        let signer = &[&vault_seeds[..]];

        // Transfer all vault SOL to the submitter via CPI signed by the PDA
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.submitter.to_account_info(),
                },
                signer,
            ),
            vault_balance,
        )?;

        ctx.accounts.bounty_box.is_settled = true;
        ctx.accounts.bounty_box.winner = Some(submitter);

        emit!(BountyReleased {
            box_id,
            submitter,
            amount: vault_balance,
        });

        Ok(())
    }
}

// ─── Account Structs ──────────────────────────────────────────────────────────

#[account]
#[derive(InitSpace)]
pub struct BountyBox {
    pub box_id: Pubkey,      // self-referential key for PDAs
    pub funder: Pubkey,
    #[max_len(200)]
    pub topic: String,
    pub deadline: i64,
    pub verifier_pubkey: Pubkey,
    pub total_funded: u64,
    pub is_settled: bool,
    pub winner: Option<Pubkey>,
    pub bump: u8,
    pub vault_bump: u8,
}

// ─── Instruction Contexts ─────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(nonce: [u8; 4], topic: String)]
pub struct CreateBox<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(
        init,
        payer = funder,
        space = 8 + BountyBox::INIT_SPACE,
        seeds = [b"bounty_box", funder.key().as_ref(), nonce.as_ref()],
        bump
    )]
    pub bounty_box: Account<'info, BountyBox>,

    /// CHECK: vault is a raw SOL escrow PDA — funds held here until release
    #[account(
        mut,
        seeds = [b"vault", bounty_box.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundBox<'info> {
    #[account(mut)]
    pub funder: Signer<'info>,

    #[account(mut)]
    pub bounty_box: Account<'info, BountyBox>,

    /// CHECK: vault PDA for this bounty box
    #[account(
        mut,
        seeds = [b"vault", bounty_box.key().as_ref()],
        bump = bounty_box.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseBox<'info> {
    #[account(
        mut,
        constraint = bounty_box.funder == funder.key() @ WError::Unauthorized
    )]
    pub funder: Signer<'info>,

    #[account(
        mut,
        close = funder
    )]
    pub bounty_box: Account<'info, BountyBox>,

    /// CHECK: vault PDA — lamports returned to funder
    #[account(
        mut,
        seeds = [b"vault", bounty_box.key().as_ref()],
        bump = bounty_box.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(submitter: Pubkey)]
pub struct ReleaseBounty<'info> {
    /// CHECK: The PER program's authority PDA — the ONLY allowed caller.
    /// This is the security nucleus: nobody except a CPI from
    /// the whisper-hunt-per program (via its PDA) can release funds.
    #[account(
        constraint = per_authority.key() == get_per_pda() @ WError::Unauthorized
    )]
    pub per_authority: Signer<'info>,

    #[account(mut)]
    pub bounty_box: Account<'info, BountyBox>,

    /// CHECK: vault PDA — SOL goes from here to the submitter
    #[account(
        mut,
        seeds = [b"vault", bounty_box.key().as_ref()],
        bump = bounty_box.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    /// CHECK: the submitter (whistleblower) receives the payout — validated
    /// by the `submitter` argument passed from the PER program's CPI
    #[account(mut)]
    pub submitter: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

fn get_per_pda() -> Pubkey {
    let per_id = PER_PROGRAM_ID.parse::<Pubkey>().unwrap();
    let (pda, _) = Pubkey::find_program_address(&[b"per_authority"], &per_id);
    pda
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct BoxCreated {
    pub box_id: Pubkey,
    pub funder: Pubkey,
    pub topic: String,
    pub deadline: i64,
    pub verifier_pubkey: Pubkey,
    pub initial_amount: u64,
}

#[event]
pub struct BoxFunded {
    pub box_id: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
    pub new_total: u64,
}

#[event]
pub struct BoxClosed {
    pub box_id: Pubkey,
    pub funder: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct BountyReleased {
    pub box_id: Pubkey,
    pub submitter: Pubkey,
    pub amount: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum WError {
    #[msg("Topic must be between 1 and 200 characters")]
    TopicTooLong,
    #[msg("Funding amount must be greater than zero")]
    ZeroFunding,
    #[msg("Deadline must be in the future")]
    DeadlineInPast,
    #[msg("Deadline has already passed")]
    DeadlinePassed,
    #[msg("Deadline has not yet passed")]
    DeadlineNotPassed,
    #[msg("This box has already been settled")]
    AlreadySettled,
    #[msg("Vault is empty")]
    EmptyVault,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Only the designated authority can perform this action")]
    Unauthorized,
    #[msg("Invalid submitter pubkey")]
    InvalidSubmitter,
}
