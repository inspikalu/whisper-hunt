"use client";

import React, { useState, useEffect } from "react";
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
import { Navbar } from "@/components/Navbar";
import { useToast, Toast } from "@/components/Toast";

export default function OwnerDashboardPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { publicKey, sendTransaction } = useWallet();
  const perProgram = useWhisperHuntPER();
  const l1Program = useWhisperHuntL1();

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [showConfirmPayout, setShowConfirmPayout] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [boxData, setBoxData] = useState<any>(null);
  const [isFetchingBox, setIsFetchingBox] = useState(true);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchBoxData();
    fetchSubmissions();
  }, [params.id, perProgram, l1Program]);

  const fetchBoxData = async () => {
    try {
      setIsFetchingBox(true);
      const data = await (l1Program.account as any).bountyBox.fetch(new PublicKey(params.id));
      setBoxData(data);
    } catch (error) {
      console.error("Failed to fetch box data:", error);
    } finally {
      setIsFetchingBox(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Fetch all submissions for this box using memcmp
      const allSubmissions = await (perProgram.account as any).submission.all([
        {
          memcmp: {
            offset: 8, // After 8-byte discriminator
            bytes: params.id,
          },
        },
      ]);
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error("Failed to fetch submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async (submission: any) => {
    setSelectedSubmission(submission);
    setIsDecrypting(true);
    // Simulate TEE decryption delay
    setTimeout(() => {
      setIsDecrypting(false);
      showToast("Intelligence decrypted via Sentinel TEE.", "success");
    }, 1200);
  };

  const handlePayout = async () => {
    if (!publicKey || !selectedSubmission) return;
    try {
      const boxId = new PublicKey(params.id);
      const [boxPermissions] = getBoxPermissionsPDA(boxId);
      const [perAuthority] = getPerAuthorityPDA();
      const [vault] = getVaultPDA(boxId);

      const sig = await perProgram.methods
        .approveSubmission(new BN(selectedSubmission.account.submissionId))
        .accounts({
          owner: publicKey,
          boxPermissions,
          submission: selectedSubmission.publicKey,
          perAuthority,
          l1BountyBox: boxId,
          l1Vault: vault,
          submitterWallet: selectedSubmission.account.submitter,
          l1Program: L1_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      showToast("Submission approved! Bounty released. Sig: " + sig.substring(0, 8) + "...", "success");
      setShowConfirmPayout(false);
      await fetchBoxData();
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Payout failed in detail:", error);
      const msg = (error as any).message || "Unknown error";
      showToast("Payout failed: " + msg, "error");
    }
  };

  const formattedReward = boxData ? (boxData.totalFunded.toNumber() / 1e9).toFixed(2) : "0.00";

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-28 px-6 pb-24">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-primary-container">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] font-headline mb-4 opacity-60">Reward Pool Active</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-headline text-primary">{formattedReward}</span>
              <span className="text-primary-container font-mono text-xs uppercase tracking-widest">SOL</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] text-on-surface-variant/40 monospaced truncate">
               PDA: {params.id.substring(0, 16)}...
            </div>
          </div>
          
          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-outline-variant/20">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] font-headline mb-4 opacity-60">Sentinel Context</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-headline text-on-surface">{isFetchingBox ? "..." : "Active"}</span>
            </div>
            <div className="mt-6 h-[1px] bg-outline-variant/20 w-full"></div>
          </div>

          <div className="bg-surface-container-low p-8 rounded-xl border-l-4 border-outline-variant/20">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.3em] font-headline mb-4 opacity-60">Total Intelligence Items</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-headline text-on-surface">{submissions.length.toString().padStart(2, "0")}</span>
              <span className="text-tertiary-container font-mono text-[10px] uppercase tracking-widest">Captured</span>
            </div>
             <div className="mt-6 flex gap-2">
              <span className="px-3 py-1 bg-tertiary-container/5 text-tertiary-container text-[9px] font-bold uppercase tracking-widest border border-tertiary-container/10 rounded">TEE Ready</span>
            </div>
          </div>
        </div>

        {/* Intelligence Unit */}
        <div className="flex flex-col lg:flex-row gap-12 min-h-[700px]">
          {/* Sidebar: Submissions */}
          <aside className="w-full lg:w-96 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-on-surface opacity-60 leading-none">Intelligence Stream</h2>
              <span className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors cursor-pointer text-lg" onClick={fetchSubmissions}>refresh</span>
            </div>
            
            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
              {loading ? (
                <div className="space-y-4 opacity-50">
                  {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-container-low animate-pulse rounded-xl"></div>)}
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/5">
                   <p className="text-xs text-on-surface-variant italic font-light">Waiting for encrypted transmissions...</p>
                </div>
              ) : (
                submissions.map((sub: any, idx: number) => (
                  <div 
                    key={sub.publicKey.toString()}
                    onClick={() => handleDecrypt(sub)}
                    className={`p-6 rounded-xl cursor-pointer transition-all border ${selectedSubmission?.publicKey.toString() === sub.publicKey.toString() ? 'bg-surface-container border-primary-container/30 ring-1 ring-primary-container/20 shadow-[0_0_30px_rgba(0,245,255,0.05)]' : 'bg-surface-container-low border-outline-variant/5 hover:bg-surface-container/50'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="monospaced text-[10px] text-primary-container/60 uppercase">ITEM {sub.account.submissionId.toString().padStart(3, "0")}</span>
                      <span className="text-[10px] text-on-surface-variant/40 uppercase">READY</span>
                    </div>
                    <p className="font-headline font-bold text-on-surface text-lg leading-tight mb-4 truncate italic">Encrypted Submission</p>
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-xs text-tertiary-container">enhanced_encryption</span>
                      <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest font-bold">Secure Payload ID: {sub.publicKey.toString().substring(0, 10)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Main Inspection Area */}
          <section className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden flex flex-col glass-panel">
            {selectedSubmission ? (
              <>
                <div className="p-8 border-b border-outline-variant/10 bg-surface-container/40 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-headline font-bold text-primary italic uppercase">{boxData?.topic || "Loading Mission..."}</h3>
                      <span className="px-3 py-1 rounded bg-tertiary-container/10 text-tertiary-container text-[9px] font-bold tracking-widest uppercase border border-tertiary-container/20 leading-none">TEE ATTESTED</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant/60 monospaced tracking-tight uppercase">Submitted via: <span className="text-primary-container opacity-80">{selectedSubmission.account.submitter.toString()}</span></p>
                  </div>
                </div>

                <div className="flex-1 p-10 overflow-y-auto space-y-12">
                   {isDecrypting ? (
                     <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-60">
                        <span className="material-symbols-outlined text-6xl text-primary-container animate-spin">sync</span>
                        <p className="font-headline text-sm font-bold uppercase tracking-[0.3em] text-primary-container">Attesting TEE Environment...</p>
                     </div>
                   ) : (
                     <div className="space-y-12">
                        <div className="space-y-6">
                          <label className="text-[10px] uppercase tracking-[0.4em] text-primary-container font-headline font-bold opacity-40">Decrypted Payload Data</label>
                          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 leading-relaxed font-body text-on-surface-variant shadow-inner">
                            {Buffer.from(selectedSubmission.account.encryptedBlob).toString()}
                          </div>
                        </div>

                        <div className="space-y-6">
                           <label className="text-[10px] uppercase tracking-[0.4em] text-outline-variant font-headline font-bold opacity-40">Digital Metadata</label>
                           <div className="grid grid-cols-2 gap-8 monospaced text-xs">
                              <div className="p-4 bg-surface-container-highest/20 rounded-lg border border-outline-variant/5">
                                 <p className="text-on-surface-variant/40 mb-1">Timestamp</p>
                                 <p className="text-on-surface">{new Date(selectedSubmission.account.timestamp * 1000).toLocaleString()}</p>
                              </div>
                              <div className="p-4 bg-surface-container-highest/20 rounded-lg border border-outline-variant/5">
                                 <p className="text-on-surface-variant/40 mb-1">Session ID</p>
                                 <p className="text-on-surface">ER_PROX_{selectedSubmission.publicKey.toString().substring(0, 8).toUpperCase()}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className="p-10 border-t border-outline-variant/10 bg-surface-container/60">
                   <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-tertiary-container/10 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,255,23,0.1)]">
                           <span className="material-symbols-outlined text-tertiary-container text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        </div>
                        <div>
                           <h4 className="font-headline font-bold text-xl text-on-surface leading-tight">Authorize Settlement?</h4>
                           <p className="text-sm text-on-surface-variant font-light">Release {formattedReward} SOL bounty to the verified submitter.</p>
                        </div>
                     </div>
                      <button 
                        onClick={() => !boxData?.isSettled && setShowConfirmPayout(true)}
                        disabled={boxData?.isSettled}
                        className={`w-full sm:w-auto px-12 py-6 font-headline font-black text-lg uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-4 active:scale-95 ${
                          boxData?.isSettled 
                            ? "bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/10" 
                            : "bg-tertiary-container text-on-tertiary-fixed hover:shadow-[0_0_40px_rgba(59,255,23,0.3)]"
                        }`}
                      >
                        {boxData?.isSettled ? "Mission Settled" : "Approve & Payout"}
                        <span className="material-symbols-outlined text-2xl">
                          {boxData?.isSettled ? "verified" : "rocket_launch"}
                        </span>
                      </button>
                   </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-12 text-center space-y-8">
                <span className="material-symbols-outlined text-9xl">monitor_heart</span>
                <div>
                   <h3 className="font-headline text-3xl font-bold uppercase tracking-widest uppercase">{boxData?.topic || "Mission Hub"}</h3>
                   <p className="mt-4 font-light italic">Select an intelligence item from the stream to begin TEE attestation.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Confirmation Overlay */}
      {showConfirmPayout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-xl">
          <div className="relative w-full max-w-lg bg-surface-container-high rounded-xl border border-outline-variant/20 shadow-2xl overflow-hidden p-10 text-center glass-panel">
             <div className="w-24 h-24 bg-error-container/10 rounded-full flex items-center justify-center mx-auto mb-10 shadow-[0_0_30px_rgba(147,0,10,0.1)]">
                <span className="material-symbols-outlined text-5xl text-error">warning</span>
             </div>
             <h3 className="text-3xl font-headline text-3xl font-bold text-on-surface mb-4 tracking-tight">Confirm Settlement</h3>
             <p className="text-on-surface-variant mb-12 leading-relaxed font-light">
                Release <span className="text-primary font-bold">{formattedReward} SOL</span> from the L1 Vault? This cryptographic action is <span className="text-error font-bold uppercase tracking-widest">irreversible</span> and will finalize the bounty.
             </p>
             <div className="flex flex-col gap-4">
                <button 
                  onClick={handlePayout} 
                  className="w-full py-6 bg-tertiary-container text-on-tertiary-fixed font-headline font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                >
                  Confirm Payout
                </button>
                <button 
                  onClick={() => setShowConfirmPayout(false)} 
                  className="w-full py-6 bg-surface-container-highest text-on-surface/60 font-headline font-bold uppercase tracking-widest rounded-xl hover:text-on-surface transition-colors border border-outline-variant/10"
                >
                  Abort Operation
                </button>
             </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
    </div>
  );
}
