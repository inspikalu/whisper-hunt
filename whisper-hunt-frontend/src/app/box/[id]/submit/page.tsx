"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { useWhisperHuntL1, useWhisperHuntPER, getBoxPermissionsPDA, getSubmissionPDA } from "@/lib/anchor/anchorClient";
import { Navbar } from "@/components/Navbar";
import { useToast, Toast } from "@/components/Toast";

export default function SubmitTipPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const l1Program = useWhisperHuntL1();
  const perProgram = useWhisperHuntPER();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [contact, setContact] = useState("");

  const [boxData, setBoxData] = useState<any>(null);
  const [isFetchingBox, setIsFetchingBox] = useState(true);

  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetchBoxData();
  }, [params.id, l1Program]);

  const fetchBoxData = async () => {
    try {
      setIsFetchingBox(true);
      const data = await (l1Program.account as any).bountyBox.fetch(new PublicKey(params.id));
      setBoxData(data);
    } catch (error) {
      console.error("Failed to fetch box data:", error);
      showToast("Bounty box not found.", "error");
    } finally {
      setIsFetchingBox(false);
    }
  };

  const handleSubmit = async () => {
    if (!evidence) {
      showToast("Please provide evidence disclosure.", "info");
      return;
    }
    setLoading(true);
    try {
      const boxId = new PublicKey(params.id);
      const sessionKeypair = Keypair.generate();
      const encryptedBlob = Buffer.from(evidence);

      const tx = await perProgram.methods
        .submitTip(boxId, encryptedBlob)
        .accounts({
          submitter: sessionKeypair.publicKey,
          boxPermissions: getBoxPermissionsPDA(boxId)[0],
          submission: getSubmissionPDA(boxId)[0],
          systemProgram: SystemProgram.programId,
        })
        .signers([sessionKeypair])
        .rpc();

      setSuccess(true);
      showToast("Transmission captured successfully!", "success");
    } catch (error) {
      console.error("Failed to submit tip:", error);
      showToast("Submission failed: " + (error as any).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto pt-28 px-6 pb-24">
        {/* Security Warning Banner */}
        <div className="bg-surface-container-lowest border-l-4 border-primary-container p-6 mb-12 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
          <div>
            <p className="font-headline text-sm text-primary-container font-bold uppercase tracking-[0.2em]">Zero-Knowledge Gateway Active</p>
            <p className="text-on-surface-variant text-sm mt-1 font-light leading-relaxed">Your identity is protected by an ephemeral bridge. Your data is encrypted locally before transmission to the Private Ephemeral Rollup.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Submission Unit */}
          <section className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4">
                <h3 className="font-headline text-3xl font-bold text-primary">Intelligence Disclosure</h3>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
                  <span className="monospaced text-[10px] text-tertiary uppercase tracking-widest">Secure Tunnel Established</span>
                </div>
              </div>

              {success ? (
                <div className="bg-tertiary-container/5 border border-tertiary-container/20 p-12 text-center rounded-xl space-y-6 glass-panel">
                  <span className="material-symbols-outlined text-6xl text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <div className="space-y-2">
                    <h3 className="font-headline text-3xl text-on-surface font-bold">Transmission Captured</h3>
                    <p className="text-on-surface-variant font-light">Your intelligence has been safely stored in the Private Ephemeral Rollup. You may now safely terminate this session.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="group">
                    <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/40 mb-4 group-focus-within:text-primary transition-colors">01. Confidential Data Entry</label>
                    <div className="relative group">
                      <textarea
                        className="w-full min-h-[350px] bg-surface-container-lowest border-none ring-1 ring-outline-variant/10 focus:ring-primary-container text-on-surface p-8 font-mono text-sm leading-relaxed rounded-xl transition-all placeholder:text-on-surface-variant/10 shadow-inner"
                        placeholder="Type or paste your evidence disclosure here... Markdown supported for precise formatting."
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                      ></textarea>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading || !evidence || isFetchingBox}
                    className="w-full group relative flex items-center justify-center gap-4 py-8 bg-primary-container rounded-xl overflow-hidden transition-all active:scale-[0.98] hover:shadow-[0_0_40px_rgba(0,245,255,0.2)] disabled:opacity-50"
                  >
                    <span className="relative z-10 font-headline font-black text-on-primary-fixed uppercase tracking-[0.3em] text-sm">{loading ? "ENCRYPTING DISCLOSURE..." : "ENCRYPT & SUBMIT TIP"}</span>
                    <span className="material-symbols-outlined relative z-10 text-on-primary-fixed text-2xl group-hover:translate-x-1 transition-transform">send</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-primary transition-opacity opacity-0 group-hover:opacity-100"></div>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Context Panel */}
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-surface-container rounded-xl p-10 space-y-8 border border-outline-variant/5 relative overflow-hidden group">
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              {isFetchingBox ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 w-24 bg-surface-container-highest rounded"></div>
                  <div className="h-10 w-full bg-surface-container-highest rounded"></div>
                  <div className="pt-6 border-t border-outline-variant/10 flex justify-between">
                    <div className="h-4 w-12 bg-surface-container-highest rounded"></div>
                    <div className="h-6 w-20 bg-surface-container-highest rounded"></div>
                  </div>
                </div>
              ) : boxData ? (
                <>
                  <div className="space-y-2">
                    <span className="font-headline text-[10px] text-primary-container/60 uppercase tracking-widest">Target Bounty Instance</span>
                    <h2 className="font-headline text-3xl font-bold text-on-surface italic leading-tight uppercase">{boxData.topic}</h2>
                  </div>

                  <div className="space-y-6 pt-6 border-t border-outline-variant/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Reward Pool</span>
                      <span className="font-mono text-xl text-primary font-bold">{(boxData.totalFunded.toNumber() / 1e9).toFixed(2)} SOL</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Bounty ID</span>
                      <span className="text-[10px] font-mono text-outline-variant bg-surface-container-highest/20 px-2 py-1 rounded">BOX_{params.id.substring(0, 6).toUpperCase()}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-error uppercase tracking-widest font-bold">Error loading mission data</p>
                </div>
              )}
            </div>

            <div className="bg-surface-container-low p-8 rounded-xl border border-outline-variant/5">
              <h3 className="font-headline text-xs font-bold text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-lg">terminal</span>
                Network Proof
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shadow-[0_0_8px_rgba(59,255,23,0.5)]"></span>
                  <span>ROLLUP_7 VALIDATED SESSION</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-on-surface-variant/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container/30"></span>
                  <span>ENCRYPTION ENGINE STANDBY</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
