const { PublicKey, Connection, clusterApiUrl, Keypair } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const path = require('path');
const fs = require('fs');

async function run() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load IDLs
  const frontendRoot = path.join(__dirname, 'whisper-hunt-frontend');
  const l1Idl = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'src/lib/anchor/idl/whisper_hunt_l1.json'), 'utf8'));
  const perIdl = JSON.parse(fs.readFileSync(path.join(frontendRoot, 'src/lib/anchor/idl/whisper_hunt_per.json'), 'utf8'));

  // Load Wallet
  const walletPath = path.join(process.env.HOME, '.config/solana/id.json');
  const walletKey = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(walletKey));
  const wallet = new anchor.Wallet(keypair);

  console.log("-----------------------------------------");
  console.log("🔥 PROTOCOL WIPE INITIATED 🔥");
  console.log("Wallet: ", wallet.publicKey.toString());
  console.log("-----------------------------------------");

  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
  const l1Program = new anchor.Program(l1Idl, provider);
  const perProgram = new anchor.Program(perIdl, provider);

  try {
    // 1. Fetch all BountyBoxes for this funder
    const boxes = await l1Program.account.bountyBox.all([
      {
        memcmp: {
          offset: 40, // funder offset in BountyBox struct
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);

    console.log(`Found ${boxes.length} active boxes to liquidate.`);

    for (const box of boxes) {
      console.log(`\nProcessing Box: ${box.publicKey.toString()} ("${box.account.topic}")`);

      // 2. Close PER accounts (Permissions & Submission singleton)
      const [boxPermissions] = PublicKey.findProgramAddressSync(
        [Buffer.from('box_permissions'), box.publicKey.toBuffer()],
        perProgram.programId
      );
      
      const [submission] = PublicKey.findProgramAddressSync(
        [Buffer.from('submission'), box.publicKey.toBuffer()],
        perProgram.programId
      );

      // Check if PER accounts exist before trying to close
      const perInfo = await connection.getAccountInfo(boxPermissions);
      if (perInfo) {
        try {
          console.log(" - Closing PER Permissions & Submission...");
          const perTx = await perProgram.methods
            .closeBoxPermissions()
            .accounts({
              owner: wallet.publicKey,
              boxPermissions,
              submission,
              systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
          console.log("   ✅ PER Closed: ", perTx);
        } catch (e) {
          console.log("   ⚠️ PER Closure failed (might be already closed): ", e.message);
        }
      }

      // 3. Force Close L1 Box & Vault
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), box.publicKey.toBuffer()],
        l1Program.programId
      );

      console.log(" - Force Closing L1 Box & Vault...");
      try {
        const l1Tx = await l1Program.methods
          .forceCloseBox()
          .accounts({
            funder: wallet.publicKey,
            bountyBox: box.publicKey,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        console.log("   ✅ L1 Closed: ", l1Tx);
      } catch (e) {
        console.error("   ❌ L1 Closure failed: ", e.message);
      }
    }

    console.log("\n-----------------------------------------");
    console.log("✨ ALL PROTOCOL DATA WIPED ✨");
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("Wipe failed:", error);
  }
}

run();
