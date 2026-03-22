import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { WhisperHuntPer } from "../target/types/whisper_hunt_per";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import {
  DELEGATION_PROGRAM_ID,
  MAGIC_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  delegationRecordPdaFromDelegatedAccount,
  delegationMetadataPdaFromDelegatedAccount,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { expect } from "chai";
import * as fs from "fs";
import * as crypto from "crypto";

// ─── Privacy helpers ──────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext tip using ECDH (x25519) + AES-256-GCM.
 * This mirrors exactly what the WhisperHunt frontend will do:
 *   1. Verifier (box owner) publishes their x25519 public key.
 *   2. Submitter generates an ephemeral x25519 keypair (never stored).
 *   3. ECDH shared secret derived — the submitter immediately forgets their ephemeral private key.
 *   4. AES-256-GCM encrypts the tip with an HKDF-derived key + random IV.
 *   5. Wire: [ ephemeral_pub(32) | iv(12) | authTag(16) | ciphertext ]
 *   6. ONLY the verifier's private key can decrypt — even the Solana validators see only ciphertext.
 */
function encryptTip(tipPlaintext: string, recipientPubKeyDer: Buffer): Buffer {
  const { privateKey: ephPriv, publicKey: ephPub } = crypto.generateKeyPairSync("x25519");

  const recipientPublicKey = crypto.createPublicKey({
    key: recipientPubKeyDer,
    format: "der",
    type: "spki",
  });

  const sharedSecret = crypto.diffieHellman({ privateKey: ephPriv, publicKey: recipientPublicKey });
  const aesKey = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, Buffer.alloc(0), Buffer.from("WhisperHuntTip"), 32));

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(tipPlaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Raw x25519 public key bytes (32 bytes)
  const ephPubJwk = ephPub.export({ format: "jwk" }) as any;
  const ephPubBytes = Buffer.from(ephPubJwk.x, "base64url");

  return Buffer.concat([ephPubBytes, iv, authTag, ciphertext]);
}

/**
 * Decrypt a blob produced by encryptTip().
 * Only the holder of recipientPrivKeyDer can do this.
 */
function decryptTip(blob: Buffer, recipientPrivKeyDer: Buffer): string {
  const ephPubBytes = blob.subarray(0, 32);
  const iv          = blob.subarray(32, 44);
  const authTag     = blob.subarray(44, 60);
  const ciphertext  = blob.subarray(60);

  const ephPubJwk = { kty: "OKP", crv: "X25519", x: ephPubBytes.toString("base64url") };
  const ephPub = crypto.createPublicKey({ key: ephPubJwk as any, format: "jwk" });

  const recipientPrivKey = crypto.createPrivateKey({ key: recipientPrivKeyDer, format: "der", type: "pkcs8" });
  const sharedSecret = crypto.diffieHellman({ privateKey: recipientPrivKey, publicKey: ephPub });
  const aesKey = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, Buffer.alloc(0), Buffer.from("WhisperHuntTip"), 32));

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Polls until `box_permissions` account is no longer owned by the delegation program.
 * This must complete before approve_submission can use Account<BoxPermissions> (strict owner check).
 */
async function waitForOwnershipRevert(
  connection: Connection,
  account: PublicKey,
  expectedOwner: PublicKey,
  timeoutMs = 60000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const info = await connection.getAccountInfo(account);
    if (info && info.owner.equals(expectedOwner)) return;
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error(`Ownership did not revert to ${expectedOwner.toBase58()} within ${timeoutMs}ms`);
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe("whisper-hunt-per", () => {
  const baseConnection = new Connection("https://api.devnet.solana.com", "confirmed");
  const erConnection = new Connection("https://devnet.magicblock.app", "confirmed");

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  
  // Custom provider that sends txs to the ER network RPC directly
  const erProvider = new anchor.AnchorProvider(erConnection, provider.wallet, {
    commitment: "confirmed",
    skipPreflight: true // Skip preflight to avoid checking L1 state for ER-only transactions
  });

  const program = anchor.workspace.WhisperHuntPer as Program<WhisperHuntPer>;
  const erProgram = new Program(program.idl as any, erProvider);

  const l1ProgramId = new PublicKey("RSKiBZg1sMV2qUF3tj4gsYYWVm74sKcTAYvLK7F8Msw");
  const l1Idl = JSON.parse(fs.readFileSync("../whisper-hunt-l1/target/idl/whisper_hunt_l1.json", "utf8"));
  const l1Program = new Program(l1Idl, provider);

  const wallet    = (provider.wallet as anchor.Wallet).payer;
  const funder    = wallet;
  const verifier  = wallet;
  const submitter = wallet;

  // Verifier generates a long-lived x25519 keypair.
  // In production: the private key lives in a TEE / HSM; only the DER-encoded public key is shared.
  const { privateKey: verifierPrivDer, publicKey: verifierPubDer } =
    crypto.generateKeyPairSync("x25519", {
      privateKeyEncoding: { type: "pkcs8", format: "der" },
      publicKeyEncoding:  { type: "spki",  format: "der" },
    } as any) as { privateKey: Buffer; publicKey: Buffer };

  let boxId: PublicKey;
  let vault: PublicKey;
  let boxPermissions: PublicKey;
  let perAuthority: PublicKey;
  let encryptedBlob: Buffer;

  // ── 1. L1 bounty box ────────────────────────────────────────────────────────────
  it("Creates a BountyBox on L1 (no sensitive data on-chain)", async () => {
    const topic = "Locate and expose the insider leaking OPSEC data";
    const deadline = new anchor.BN(Math.floor(Date.now() / 1000) + 86400);
    const initialAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
    const nonce = Keypair.generate().publicKey.toBuffer().slice(0, 4);

    [boxId] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty_box"), funder.publicKey.toBuffer(), nonce],
      l1Program.programId
    );
    [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), boxId.toBuffer()],
      l1Program.programId
    );

    await l1Program.methods
      .createBox(Array.from(nonce), topic, deadline, verifier.publicKey, initialAmount)
      .accounts({ bountyBox: boxId, vault, funder: funder.publicKey, systemProgram: SystemProgram.programId } as any)
      .rpc();

    const boxState: any = await (l1Program as any).account.bountyBox.fetch(boxId);
    expect(boxState.topic).to.equal(topic);
    expect(boxState.totalFunded.toString()).to.equal(initialAmount.toString());

    // Privacy assertion: the public L1 account must NOT contain any tip content
    expect(Object.keys(boxState)).to.not.include("encryptedBlob");
    console.log("  ✅ Privacy: L1 BountyBox stores only public metadata — no tip content");
  });

  // ── 2. PER permissions ──────────────────────────────────────────────────────────
  it("Creates BoxPermissions in PER", async () => {
    [boxPermissions] = PublicKey.findProgramAddressSync(
      [Buffer.from("box_permissions"), boxId.toBuffer()],
      program.programId
    );
    
    // Pre-allocate the Submission PDA on L1 during the onboarding phase
    const [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), boxId.toBuffer()],
      program.programId
    );

    const ix = await program.methods
      .createBoxPermissions(boxId, verifier.publicKey)
      .accounts({ boxPermissions, submission: submissionPda, payer: funder.publicKey, systemProgram: SystemProgram.programId } as any)
      .instruction();

    const tx = new anchor.web3.Transaction().add(ix);
    tx.recentBlockhash = (await baseConnection.getLatestBlockhash("confirmed")).blockhash;
    tx.feePayer = funder.publicKey;

    await anchor.web3.sendAndConfirmTransaction(baseConnection, tx, [funder], { 
      commitment: "confirmed",
      skipPreflight: false,
    });

    const permState = await program.account.boxPermissions.fetch(boxPermissions);
    expect(permState.owner.toBase58()).to.equal(funder.publicKey.toBase58());
  });

  // ── 2.5. ER Delegation ──────────────────────────────────────────────────────────
  it("Delegates the BoxPermissions account to the MagicBlock Ephemeral Rollup", async () => {
    const bpDelegationRecord = delegationRecordPdaFromDelegatedAccount(boxPermissions);
    const bpDelegationMetadata = delegationMetadataPdaFromDelegatedAccount(boxPermissions);
    const bpBuffer = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(boxPermissions, program.programId);

    const [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), boxId.toBuffer()],
      program.programId
    );
    const subDelegationRecord = delegationRecordPdaFromDelegatedAccount(submissionPda);
    const subDelegationMetadata = delegationMetadataPdaFromDelegatedAccount(submissionPda);
    const subBuffer = delegateBufferPdaFromDelegatedAccountAndOwnerProgram(submissionPda, program.programId);

    await program.methods
      .delegateBoxPermissions(boxId)
      .accounts({
        payer: funder.publicKey,
        boxPermissions,
        bpBuffer,
        bpDelegationRecord,
        bpDelegationMetadata,
        submission: submissionPda,
        subBuffer,
        subDelegationRecord,
        subDelegationMetadata,
        delegationProgram: DELEGATION_PROGRAM_ID,
        ownerProgram: program.programId,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    
    // Wait a moment for ER state sync
    await new Promise(r => setTimeout(r, 2000));
  });

  // ── 3. Encrypted tip submission ────────────────────────────────────────────────
  it("Submits a real ECDH-encrypted tip — plaintext never on-chain", async () => {
    
    // The submitter generates a completely ephemeral session keypair to sign the tip submission
    const tipSession = Keypair.generate();

    // Realistic tip payload (this would be entered into a frontend form)
    const rawTip = JSON.stringify({
      subject:   "Insider threat — identity and incident details",
      evidence:  "Operative BRAVO-7 met handler at coordinates 48.8566°N 2.3522°E on 2026-03-15 at 22:00 UTC",
      documents: "hash:sha256:a3f1c2d094bee4e5...",  // content-addressed reference to encrypted file store
      contactKey: Keypair.generate().publicKey.toBase58(), // throwaway key for follow-up comms
    });

    // ── CLIENT-SIDE ENCRYPT: plaintext never leaves the browser/app ──────────────
    encryptedBlob = encryptTip(rawTip, Buffer.from(verifierPubDer as any));

    // Verify: ciphertext is meaningless without the private key
    const blobStr = encryptedBlob.toString("binary");
    expect(blobStr).to.not.include("BRAVO-7");
    expect(blobStr).to.not.include("48.8566");
    expect(blobStr).to.not.include("Insider threat");
    expect(encryptedBlob.length).to.be.greaterThan(60); // header bytes alone are 60 bytes
    console.log(`  ✅ Privacy: ${encryptedBlob.length}-byte blob is opaque ciphertext`);

    // ── Submit encrypted blob to PER program (DIRECTLY TO ER) ────────────────────
    const [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), boxId.toBuffer()],
      erProgram.programId
    );

    // ********************************************************************************
    // THIS CALL HAPPENS DIRECTLY ON THE TEE/EPHEMERAL ROLLUP RPC FOR MAXIMUM PRIVACY 
    // AND ZERO-GAS THROUGHOUT. "skipPreflight: true" is critical here because the
    // transaction is completely opaque and uses a ZERO-BALANCE ephemeral session key.
    // ********************************************************************************
    const ix = await erProgram.methods
      .submitTip(boxId, encryptedBlob)
      .accounts({ 
        submitter: tipSession.publicKey, 
        boxPermissions, 
        submission: submissionPda, 
        systemProgram: SystemProgram.programId 
      } as any)
      .instruction();

    const tx = new anchor.web3.Transaction().add(ix);
    tx.recentBlockhash = (await erConnection.getLatestBlockhash("confirmed")).blockhash;
    // Mic drop: The fee payer is the zero-balance ephemeral key, proving zero-gas ER throughput!
    tx.feePayer = tipSession.publicKey;
    
    await anchor.web3.sendAndConfirmTransaction(erConnection, tx, [tipSession], { skipPreflight: true, commitment: "confirmed" });

    // ── Verify on-chain storage (ON ER VALIDATOR) ─────────────────────────────────
    // We must fetch from erProgram; the L1 base layer doesn't know about this tip yet
    const subState = await (erProgram as any).account.submission.fetch(submissionPda);
    expect(subState.isApproved).to.be.false;

    const storedBlob = Buffer.from(subState.encryptedBlob as unknown as number[]);
    expect(storedBlob.equals(encryptedBlob)).to.be.true; // stored verbatim — no server decryption

    // On-chain blob still cannot be plaintext-searched
    expect(storedBlob.toString("binary")).to.not.include("BRAVO-7");

    // ── Authorised verifier CAN decrypt (simulates TEE-side verification) ─────────
    const decrypted = decryptTip(storedBlob, Buffer.from(verifierPrivDer as any));
    const parsed = JSON.parse(decrypted);
    expect(parsed.subject).to.include("Insider threat");
    expect(parsed.evidence).to.include("BRAVO-7");
    expect(parsed.evidence).to.include("2026-03-15");
    console.log("  ✅ Privacy: Verifier (with private key) can decrypt the full tip");

    // ── Third party CANNOT decrypt without the private key ────────────────────────
    const { privateKey: attackerPrivDer } =
      crypto.generateKeyPairSync("x25519", {
        privateKeyEncoding: { type: "pkcs8", format: "der" },
      } as any) as { privateKey: Buffer };

    let decryptionFailed = false;
    try {
      decryptTip(storedBlob, attackerPrivDer);
    } catch {
      decryptionFailed = true;
    }
    expect(decryptionFailed).to.be.true;
    console.log("  ✅ Privacy: Attacker without private key CANNOT decrypt — AES-GCM auth tag rejected");
  });

  // ── 3.5. Commit / Undelegate back to Base Layer ─────────────────────────────────
  it("Undelegates BoxPermissions and Submission back to Solana L1", async () => {
    // Both states are on the ER right now.
    // CRITICAL: undelegateState calls commit_accounts which is a CPI to MAGIC_PROGRAM_ID.
    // MAGIC_PROGRAM_ID only exists on the ER validator — send this tx to the ER RPC.
    const [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), boxId.toBuffer()],
      erProgram.programId
    );

    const ix = await erProgram.methods
      .undelegateState()
      .accounts({
        payer: verifier.publicKey,
        boxPermissions,
        submission: submissionPda,
        magicContext: MAGIC_CONTEXT_ID,
        magicProgram: MAGIC_PROGRAM_ID,
      } as any)
      .instruction();

    const tx = new anchor.web3.Transaction().add(ix);
    tx.recentBlockhash = (await erConnection.getLatestBlockhash("confirmed")).blockhash;
    tx.feePayer = verifier.publicKey;
    await anchor.web3.sendAndConfirmTransaction(erConnection, tx, [verifier], { skipPreflight: true, commitment: "confirmed" });

    // Wait for ER → L1 state finalization and ownership revert.
    // Poll until box_permissions is owned by the PER program again
    // (delegation program releases ownership asynchronously).
    await waitForOwnershipRevert(
      baseConnection,
      boxPermissions,
      program.programId,
    );
    console.log("  ✅ Undelegation: ownership reverted to PER program");
  });

  // ── 4. CPI approval and bounty payout ───────────────────────────────────────────
  it("Approves the submission and releases L1 bounty via CPI", async () => {
    const [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), boxId.toBuffer()],
      program.programId
    );
    [perAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("per_authority")],
      program.programId
    );

    const initialBal = await provider.connection.getBalance(submitter.publicKey);

    await program.methods
      .approveSubmission(new anchor.BN(0))
      .accounts({
        owner: verifier.publicKey,          // Rust field is `owner`, not `verifier`
        submission: submissionPda,
        boxPermissions,
        perAuthority,
        submitterWallet: submitter.publicKey,
        l1Program: l1Program.programId,
        l1BountyBox: boxId,
        l1Vault: vault,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    const subState = await program.account.submission.fetch(submissionPda);
    expect(subState.isApproved).to.be.true;

    const finalBal = await provider.connection.getBalance(submitter.publicKey);
    const diff = finalBal - initialBal;
    // wallet == funder == submitter == verifier, so it receives 0.5 SOL back minus tx fees.
    // Net should be positive (received > fees paid)
    expect(diff).to.be.greaterThan(0);

    const boxState: any = await (l1Program as any).account.bountyBox.fetch(boxId);
    expect(boxState.isSettled).to.be.true;
    console.log("  ✅ CPI: PER program released bounty from L1 vault via on-chain proof of approval");
  });

});
