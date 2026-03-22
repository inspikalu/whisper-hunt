const { PublicKey, Connection, clusterApiUrl } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const path = require('path');
const fs = require('fs');

async function run() {
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Load IDL from its known location
  const l1IdlPath = path.join(__dirname, 'whisper-hunt-frontend/src/lib/anchor/idl/whisper_hunt_l1.json');
  if (!fs.existsSync(l1IdlPath)) {
     console.error("IDL not found at: ", l1IdlPath);
     return;
  }
  const l1Idl = JSON.parse(fs.readFileSync(l1IdlPath, 'utf8'));

  // Use the local Solana CLI wallet
  const walletPath = path.join(process.env.HOME, '.config/solana/id.json');
  if (!fs.existsSync(walletPath)) {
     console.error("Wallet not found at: ", walletPath);
     return;
  }
  const walletKey = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
  const keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(walletKey));
  const wallet = new anchor.Wallet(keypair);

  console.log("Using Wallet: ", wallet.publicKey.toString());

  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
  const program = new anchor.Program(l1Idl, provider);

  try {
    const boxes = await program.account.bountyBox.all([
      {
        memcmp: {
          offset: 40, // Funder offset
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);

    console.log(`Found ${boxes.length} active boxes for your wallet.`);
    const now = Math.floor(Date.now() / 1000);

    for (const box of boxes) {
      const deadline = box.account.deadline.toNumber();
      console.log(`\nBox: ${box.publicKey.toString()}`);
      console.log(`Topic: ${box.account.topic}`);
      console.log(`Deadline: ${new Date(deadline * 1000).toLocaleString()}`);
      
      if (now <= deadline) {
        console.log("⚠️  Deadline not yet reached. Cannot reclaim funds until expiry.");
        continue;
      }

      if (box.account.isSettled) {
        console.log("✅ Already settled/closed.");
        continue;
      }

      console.log("🚀 Reclaiming funds...");
      const [vault] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), box.publicKey.toBuffer()],
        program.programId
      );

      try {
        const tx = await program.methods
          .closeBox()
          .accounts({
            funder: wallet.publicKey,
            bountyBox: box.publicKey,
            vault,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        console.log("✨ Success! Signature: ", tx);
      } catch (e) {
        console.error("❌ Failed to close box: ", e.message);
      }
    }
  } catch (error) {
    console.error("Audit failed:", error);
  }
}

run();
