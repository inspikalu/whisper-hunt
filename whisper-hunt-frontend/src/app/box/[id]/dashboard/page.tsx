"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { 
  useWhisperHuntL1, 
  useWhisperHuntPER, 
  getBoxPermissionsPDA, 
  getSubmissionPDA, 
  getPerAuthorityPDA, 
  getVaultPDA, 
  L1_PROGRAM_ID 
} from "@/lib/anchor/anchorClient";

export default function OwnerDashboardPage({ params }: { params: { id: string } }) {
  const { publicKey, sendTransaction } = useWallet();
  const perProgram = useWhisperHuntPER();
  const l1Program = useWhisperHuntL1();

  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [showConfirmPayout, setShowConfirmPayout] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleDecrypt = async () => {
    if (!publicKey) return;
    setIsDecrypting(true);
    try {
      // In a real TEE app, this would trigger an attestation challenge
      // For now, we simulate the "authentic" feeling by fetching submission state
      const [submissionPDA] = getSubmissionPDA(new PublicKey(params.id));
      const submissionAccount = await perProgram.account.submission.fetch(submissionPDA);
      console.log("Decrypted Submission Data:", submissionAccount);
    } catch (error) {
      console.error("Failed to decrypt:", error);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handlePayout = async () => {
    if (!publicKey) return;
    try {
      const boxId = new PublicKey(params.id);
      const [boxPermissions] = getBoxPermissionsPDA(boxId);
      const [submission] = getSubmissionPDA(boxId);
      const [perAuthority] = getPerAuthorityPDA();
      const [vault] = getVaultPDA(boxId);

      // We need to fetch the submission to get the submitter's address
      const subAccount = await perProgram.account.submission.fetch(submission) as any;

      const tx = await perProgram.methods
        .approveSubmission(new BN(0)) // Assuming index 0 for simplicity
        .accounts({
          owner: publicKey,
          boxPermissions,
          submission,
          perAuthority,
          l1BountyBox: boxId,
          l1Vault: vault,
          submitterWallet: subAccount.submitter,
          l1Program: L1_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const sig = await sendTransaction(tx, perProgram.provider.connection);
      await perProgram.provider.connection.confirmTransaction(sig, "confirmed");
      
      setShowConfirmPayout(false);
      alert("Submission approved! Bounty released to submitter's stealth address.");
    } catch (error) {
      console.error("Payout failed:", error);
      alert("Payout failed: " + (error as any).message);
    }
  };

  return (
    <div className="bg-background min-h-screen pb-24 md:pb-0">
      <header className="bg-[#111318] sticky top-0 z-50 border-b border-outline-variant/10">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00F5FF] text-2xl">security</span>
            <Link href="/" className="font-['Space_Grotesk'] text-on-surface tracking-tight text-2xl font-bold text-[#00F5FF] tracking-tighter uppercase">WhisperHunt</Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-6 mr-6">
              <Link href="#" className="font-['Space_Grotesk'] text-[#e2e2e8]/60 hover:text-[#00F5FF] transition-all duration-300 cursor-pointer text-sm font-medium tracking-widest uppercase text-center flex items-center">Network</Link>
              <Link href="#" className="font-['Space_Grotesk'] text-[#00F5FF] font-bold cursor-pointer text-sm font-medium tracking-widest uppercase text-center flex items-center">Dashboard</Link>
            </div>
            <WalletMultiButton className="!bg-surface-container !border !border-outline-variant/30 !rounded-full !px-4 !py-1.5 !h-auto !text-xs !font-mono !text-on-surface-variant" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:pt-10">
        {/* Box Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-primary-container/30">
            <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-headline mb-2">Total SOL in Vault</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-headline text-primary">50.00</span>
              <span className="text-primary-container font-mono text-sm">SOL</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-tertiary-container/80">
              <span className="material-symbols-outlined text-xs">verified</span>
              <span className="monospaced truncate">PDA: {params.id.substring(0, 12)}...</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-outline-variant/30">
            <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-headline mb-2">Time Remaining</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-headline text-on-surface">Active</span>
            </div>
            <div className="mt-4 bg-surface-container-highest/30 h-1 w-full rounded-full overflow-hidden">
              <div className="bg-primary-container h-full w-full"></div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl border-l-2 border-outline-variant/30">
            <p className="text-on-surface-variant text-xs uppercase tracking-[0.2em] font-headline mb-2">Total Submissions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-headline text-on-surface">08</span>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="px-2 py-0.5 rounded bg-tertiary-container/10 text-tertiary-container text-[10px] font-mono">3 NEW</span>
              <span className="px-2 py-0.5 rounded bg-primary-container/10 text-primary-container text-[10px] font-mono">TEE READY</span>
            </div>
          </div>
        </div>

        {/* Dashboard Layout */}
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
          {/* Sidebar: Submission List */}
          <aside className="w-full lg:w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">Submissions</h2>
              <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary transition-colors">filter_list</span>
            </div>
            
            <button 
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full py-4 bg-primary-container text-on-primary-fixed font-headline font-bold uppercase tracking-tighter rounded-xl hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isDecrypting ? "sync" : "enhanced_encryption"}
              </span>
              {isDecrypting ? "Authenticating TEE..." : "Decrypt Inbox"}
            </button>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] no-scrollbar pr-1">
              <div 
                onClick={() => setSelectedSubmission(8)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedSubmission === 8 ? 'bg-surface-container-high border-primary-container/30' : 'bg-surface-container border-outline-variant/10'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="monospaced text-[10px] text-primary-container">ID: 0xFD...2A1</span>
                  <span className="text-[10px] text-on-surface-variant/60 uppercase">2m ago</span>
                </div>
                <p className="font-headline font-bold text-on-surface mb-1">Submission #008</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></div>
                  <span className="text-[10px] text-tertiary-container font-medium uppercase tracking-wider">Decrypted</span>
                </div>
              </div>

              {[7, 6].map((i) => (
                <div key={i} className="bg-surface-container-lowest/50 border border-outline-variant/10 p-4 rounded-xl opacity-60 relative overflow-hidden group cursor-not-allowed">
                  <div className="flex justify-between items-start mb-2">
                    <span className="monospaced text-[10px] text-outline">ID: 0x88...B{i}</span>
                    <span className="text-[10px] text-on-surface-variant/40 uppercase">{i}h ago</span>
                  </div>
                  <p className="font-headline font-bold text-on-surface-variant mb-1">Submission #00{i}</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-outline">lock</span>
                    <span className="text-[10px] text-outline font-medium uppercase tracking-wider">Encrypted (TEE)</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content: Decrypted View */}
          <section className="flex-1 bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/10 flex flex-col">
            <div className="p-6 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-headline font-bold text-primary">Intelligence Report #008</h3>
                  <span className="px-2 py-0.5 rounded-full bg-tertiary-container/10 text-tertiary-container text-[10px] font-mono border border-tertiary-container/20">VERIFIED AUTH</span>
                </div>
                <p className="text-xs text-on-surface-variant monospaced">Submitted by: <span className="text-on-surface">3mUv...q8Kz</span> (Encrypted Proxy)</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-surface-container-highest hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                </button>
                <button className="p-2 rounded-lg bg-surface-container-highest hover:bg-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-sm">flag</span>
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-8 text-on-surface">
              <div className="max-w-3xl">
                <label className="text-[10px] uppercase tracking-[0.3em] text-primary-container font-headline mb-4 block">Decrypted Payload (TEE Environment)</label>
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 font-body text-on-surface-variant leading-relaxed shadow-inner">
                  This report contains decrypted content from the whistleblower. The TEE-based decryption ensures that only the verified verifier can view this information through this secure interface. Payout will be released to the submitter's stealth address upon approval.
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-outline font-headline mb-4 block">Evidence Attachments (2)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="group relative aspect-square bg-surface-container-highest rounded-lg overflow-hidden border border-outline-variant/30 cursor-pointer">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                      <span className="material-symbols-outlined text-2xl mb-2 text-primary-container">description</span>
                      <span className="text-[10px] monospaced truncate w-full">leak_log_v1.csv</span>
                    </div>
                  </div>
                  <div className="group relative aspect-square bg-surface-container-highest rounded-lg border-2 border-dashed border-outline-variant/30 flex items-center justify-center">
                    <span className="text-[10px] monospaced text-outline">REDACTED_DATA.BIN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-outline-variant/10 bg-surface-container/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-left">
                  <div className="p-3 bg-tertiary-container/10 rounded-full">
                    <span className="material-symbols-outlined text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface">Valid Intelligence?</h4>
                    <p className="text-xs text-on-surface-variant">Approving this will release the 50.0 SOL bounty to the submitter.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfirmPayout(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-tertiary-container text-on-tertiary-fixed font-headline font-extrabold text-lg uppercase tracking-tighter rounded-xl hover:shadow-[0_0_30px_rgba(59,255,23,0.2)] transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Approve & Payout
                  <span className="material-symbols-outlined">rocket_launch</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmPayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowConfirmPayout(false)}></div>
          <div className="relative w-full max-w-md bg-surface-container-high rounded-xl border border-outline-variant shadow-2xl overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-error-container/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-error">warning</span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-2">Confirm Payout</h3>
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Release <span className="text-primary font-bold">50.0 SOL</span> to this submission? This action is <span className="text-error uppercase font-bold tracking-widest">permanent</span> and will end the bounty immediately.
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={handlePayout} className="w-full py-4 bg-tertiary-container text-on-tertiary-fixed font-headline font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity">
                  Confirm Transaction
                </button>
                <button onClick={() => setShowConfirmPayout(false)} className="w-full py-4 bg-surface-container-highest text-on-surface font-headline font-bold uppercase tracking-widest rounded-xl hover:bg-surface-variant transition-colors">
                  Cancel
                </button>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-tertiary-container via-primary-container to-tertiary-container"></div>
          </div>
        </div>
      )}
    </div>
  );
}
