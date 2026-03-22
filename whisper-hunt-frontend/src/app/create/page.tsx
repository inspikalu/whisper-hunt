"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWhisperHuntL1, useWhisperHuntPER, getBountyBoxPDA, getVaultPDA, getBoxPermissionsPDA, getSubmissionPDA, getPerAuthorityPDA } from "@/lib/anchor/anchorClient";
import { useToast, Toast } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";

export default function CreateBoxPage() {
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [verifierKey, setVerifierKey] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [boxUrl, setBoxUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  const l1Program = useWhisperHuntL1();
  const perProgram = useWhisperHuntPER();
  const { publicKey, sendTransaction } = useWallet();

  const handleCreate = async () => {
    if (!publicKey) {
      showToast("Please connect your wallet first.", "error");
      return;
    }
    if (!topic || !amount || !deadline) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      showToast("Deadline must be in the future.", "error");
      return;
    }

    setLoading(true);
    try {
      // Prevent duplicate topics from the same user
      const existingBoxes = await (l1Program.account as any).bountyBox.all([
        {
          memcmp: {
            offset: 40, // offset of 'funder' in BountyBox (8 discriminator + 32 box_id) -- WAIT let me check IDL
            bytes: publicKey.toBase58(),
          },
        },
      ]);
      
      // Actually, let's just fetch all and filter in memory for safety with offsets
      // or use the 'funder' field offset from IDL. 
      // IDL: box_id (32), funder (32) => funder starts at 8 + 32 = 40. Correct.
      
      const isDuplicate = existingBoxes.some((box: any) => 
        box.account.topic.toLowerCase() === topic.trim().toLowerCase()
      );

      if (isDuplicate) {
        showToast("You already have an active bounty for this topic.", "error");
        setLoading(false);
        return;
      }

      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(4)));
      const [bountyBox] = getBountyBoxPDA(publicKey, nonce);
      const [vault] = getVaultPDA(bountyBox);
      const [boxPermissions] = getBoxPermissionsPDA(bountyBox);

      const amountBN = new BN(parseFloat(amount) * 1e9); // SOL to lamports
      const deadlineTs = new BN(Math.floor(new Date(deadline).getTime() / 1000));
      
      let verifierPubkey = PublicKey.default;
      if (verifierKey) {
        try {
          verifierPubkey = new PublicKey(verifierKey);
        } catch (e) {
          showToast("Invalid Verifier Public Key.", "error");
          setLoading(false);
          return;
        }
      }

      const tx = new Transaction();
      
      const createBoxIx = await l1Program.methods
        .createBox(nonce, topic, deadlineTs, verifierPubkey, amountBN)
        .accounts({
          funder: publicKey,
          bountyBox,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const createPermissionsIx = await perProgram.methods
        .createBoxPermissions(bountyBox, verifierPubkey)
        .accounts({
          owner: publicKey,
          boxPermissions,
          submission: getSubmissionPDA(bountyBox)[0],
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      tx.add(createBoxIx);
      tx.add(createPermissionsIx);

      const sig = await sendTransaction(tx, l1Program.provider.connection);
      await l1Program.provider.connection.confirmTransaction(sig, "confirmed");

      showToast("Bounty Vault deployed successfully!", "success");
      setBoxUrl(window.location.origin + `/box/${bountyBox.toString()}/submit`);
      setIsSuccess(true);
    } catch (error) {
      console.error("Failed to create box:", error);
      showToast("Creation failed: " + (error as any).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <section className="mt-12 mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8">
            <span className="text-primary-fixed-dim font-label tracking-[0.3em] uppercase text-xs mb-4 block underline-offset-8 underline decoration-primary-container/30">Secure Intelligence Deployment</span>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-primary">
              Create a <br/><span className="text-on-surface-variant/30">Bounty.</span>
            </h2>
            <p className="mt-8 text-lg text-on-surface-variant max-w-xl leading-relaxed font-light">
              Create a cryptographic vault for information retrieval. Your funds are escrowed on-chain and only released when the hunt is successful.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-12">
              <div className="group">
                <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/40 mb-6 group-focus-within:text-primary transition-colors">01. Disclosure Objective</label>
                <div className="bg-surface-container-lowest border-b border-outline-variant/10 focus-within:border-primary-container transition-all p-6 rounded-t-xl group-focus-within:bg-surface-container/30">
                  <textarea 
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xl font-headline placeholder:text-on-surface-variant/10 min-h-[140px] resize-none" 
                    placeholder="E.g., Who authorized the Gdynia supply chain discrepancy?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="group">
                  <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/40 mb-6 group-focus-within:text-primary transition-colors">02. Bounty Pool</label>
                  <div className="flex items-center bg-surface-container-lowest border-b border-outline-variant/10 focus-within:border-primary-container transition-all p-6 rounded-t-xl group-focus-within:bg-surface-container/30">
                    <input 
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-3xl font-headline placeholder:text-on-surface-variant/10" 
                      placeholder="0.00" 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <span className="font-label text-xs font-bold text-primary ml-2 uppercase tracking-widest">SOL</span>
                  </div>
                </div>

                <div className="group">
                  <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/40 mb-6 group-focus-within:text-primary transition-colors">03. Target Deadline</label>
                  <div className="flex items-center bg-surface-container-lowest border-b border-outline-variant/10 focus-within:border-primary-container transition-all p-6 rounded-t-xl group-focus-within:bg-surface-container/30">
                    <input 
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-headline text-on-surface placeholder:text-on-surface-variant/10 [color-scheme:dark]" 
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-outline-variant/5">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/40 hover:text-primary transition-colors mb-6"
                >
                  <span className="material-symbols-outlined text-sm">{showAdvanced ? "expand_less" : "tune"}</span>
                  {showAdvanced ? "Hide Advanced Settings" : "Configure Custom Sentinel"}
                </button>

                {showAdvanced && (
                  <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface opacity-60">Sentinel configuration</span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <input 
                        className="w-full bg-surface-container-lowest border border-outline-variant/10 focus:outline-none focus:border-primary-container focus:ring-0 rounded-lg p-4 monospaced text-sm placeholder:text-on-surface-variant/20 text-on-surface" 
                        placeholder="Verifier Public Key (Identity)" 
                        type="text"
                        value={verifierKey}
                        onChange={(e) => setVerifierKey(e.target.value)}
                      />
                       <p className="text-[11px] text-on-surface-variant/40 leading-relaxed italic">
                        Specify the trusted identity that will verify the intelligence. If left blank, the Sentinel TEE will automatically generate a secure identity for this box.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleCreate}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-primary-container py-8 rounded-xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-[0_0_50px_rgba(0,245,255,0.05)] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-on-primary-fixed text-2xl group-hover:rotate-12 transition-transform">encrypted</span>
                <span className="font-headline font-black text-on-primary-fixed uppercase tracking-[0.25em] text-sm">
                  {loading ? "Approving Deployment..." : "Create Bounty"}
                </span>
              </button>
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-8">
            <div className="p-8 bg-surface-container-low rounded-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 font-headline font-black text-8xl text-primary-container/20">IV</div>
              <h3 className="font-headline text-2xl font-bold mb-8 text-primary">Intelligence Protocol</h3>
              <ul className="space-y-8">
                <li className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/5">
                    <span className="material-symbols-outlined text-primary-container text-xl">account_balance_wallet</span>
                  </div>
                  <div>
                     <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-2">Escrow Lock</h4>
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed font-light">Funds are held in a secure L1 program and only released upon valid cryptographic proof submission.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="w-12 h-12 shrink-0 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/5">
                    <span className="material-symbols-outlined text-primary-container text-xl">visibility_off</span>
                  </div>
                  <div>
                    <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-2">Zero Reveal</h4>
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed font-light">The whistleblower remains anonymous throughout the lifecycle of the hunt, from submission to payout.</p>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-xl p-6">
          <div className="max-w-md w-full glass-panel border border-primary-container/10 p-10 rounded-xl text-center space-y-8">
            <div className="w-24 h-24 bg-tertiary-container/10 flex items-center justify-center rounded-full mx-auto shadow-[0_0_30px_rgba(59,255,23,0.1)]">
              <span className="material-symbols-outlined text-tertiary-container text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="font-headline text-3xl font-bold text-on-surface tracking-tight">Bounty Created</h3>
              <p className="text-on-surface-variant text-sm font-light">Your bounty is now live on-chain. Share the secure gate with your sources.</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl flex items-center justify-between border border-outline-variant/10 group">
              <span className="monospaced text-[12px] text-primary truncate mr-4">{boxUrl}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(boxUrl);
                }}
                className="shrink-0 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
              >
                content_copy
              </button>
            </div>
            <Link href="/intelligence" className="w-full flex items-center justify-center bg-surface-container-highest py-5 rounded-xl font-headline font-bold uppercase text-xs tracking-[0.2em] hover:bg-primary-container hover:text-on-primary-fixed transition-all border border-outline-variant/10 overflow-hidden">
               Back to Hub
            </Link>
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
    </>
  );
}
