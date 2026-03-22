"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useWhisperHuntL1, useWhisperHuntPER, getBountyBoxPDA, getVaultPDA, getBoxPermissionsPDA, getSubmissionPDA, getPerAuthorityPDA } from "@/lib/anchor/anchorClient";

export default function CreateBoxPage() {
  const [topic, setTopic] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [verifierKey, setVerifierKey] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [boxUrl, setBoxUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const l1Program = useWhisperHuntL1();
  const perProgram = useWhisperHuntPER();
  const { publicKey, sendTransaction } = useWallet();

  const handleCreate = async () => {
    if (!publicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    setLoading(true);
    try {
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(8)));
      const [bountyBox] = getBountyBoxPDA(publicKey, nonce);
      const [vault] = getVaultPDA(bountyBox);
      const [boxPermissions] = getBoxPermissionsPDA(bountyBox);
      const [perAuthority] = getPerAuthorityPDA();

      const amountBN = new BN(parseFloat(amount) * 1e9); // SOL to lamports

      // Transaction to create L1 Box and Initialize PER Permissions
      const tx = new Transaction();
      
      const createBoxIx = await l1Program.methods
        .createBox(nonce, amountBN)
        .accounts({
          funder: publicKey,
          bountyBox,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const createPermissionsIx = await perProgram.methods
        .createBoxPermissions(bountyBox)
        .accounts({
          funder: publicKey,
          boxPermissions,
          perAuthority,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      tx.add(createBoxIx);
      tx.add(createPermissionsIx);

      const sig = await sendTransaction(tx, l1Program.provider.connection);
      await l1Program.provider.connection.confirmTransaction(sig, "confirmed");

      setBoxUrl(window.location.origin + `/box/${bountyBox.toBuffer().toString("hex")}/submit`);
      setIsSuccess(true);
    } catch (error) {
      console.error("Failed to create box:", error);
      alert("Creation failed: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-[#1a1c20] transition-colors duration-500">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00F5FF]">security</span>
            <Link href="/" className="font-['Space_Grotesk'] text-on-surface tracking-tight text-2xl font-bold text-[#00F5FF] uppercase">WhisperHunt</Link>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-8">
              <Link className="text-[#00F5FF] font-bold font-label text-sm tracking-widest uppercase transition-all duration-300" href="/create">Create Box</Link>
              <Link className="text-[#e2e2e8]/60 font-label text-sm tracking-widest uppercase hover:text-[#00F5FF] transition-all duration-300" href="#">Submit Tip</Link>
              <Link className="text-[#e2e2e8]/60 font-label text-sm tracking-widest uppercase hover:text-[#00F5FF] transition-all duration-300" href="#">Dashboard</Link>
            </nav>
            <WalletMultiButton className="!bg-primary-container !text-on-primary-fixed !px-5 !py-2 !rounded-xl !font-label !font-bold !text-xs !uppercase !tracking-widest hover:!shadow-[0_0_15px_rgba(0,245,255,0.3)] !transition-all active:!scale-95" />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <section className="mt-12 mb-20 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-8">
            <span className="text-primary-fixed-dim font-label tracking-[0.3em] uppercase text-xs mb-4 block">Securing Global Intelligence</span>
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-primary">
              Incentivize the <br /><span className="text-on-surface-variant/40">Truth Seekers.</span>
            </h2>
            <p className="mt-8 text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Create secure, cryptographic bounties for whistleblowers. 100% on-chain privacy powered by decentralized encryption. Your box, your rules, absolute anonymity.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <div className="w-full h-32 bg-surface-container-low rounded-xl flex items-center justify-center border border-outline-variant/10 group hover:border-primary-fixed-dim/30 transition-colors">
              <div className="text-center">
                <div className="text-primary-fixed-dim text-3xl font-headline font-bold">12.4k</div>
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">Total SOL Locked</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-8">
              <div className="group">
                <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60 mb-4 group-focus-within:text-primary-fixed-dim transition-colors">01. Disclosure Objective</label>
                <div className="bg-surface-container-lowest border-b border-outline-variant/20 focus-within:border-primary transition-all p-4 rounded-t-xl">
                  <textarea 
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-xl font-headline placeholder:text-on-surface-variant/20 min-h-[120px] resize-none" 
                    placeholder="Who approved the suspicious governance proposal?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="group">
                  <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60 mb-4 group-focus-within:text-primary-fixed-dim transition-colors">02. Reward Amount</label>
                  <div className="relative flex items-center bg-surface-container-lowest border-b border-outline-variant/20 focus-within:border-primary transition-all p-4 rounded-t-xl">
                    <span className="material-symbols-outlined text-primary-fixed-dim mr-3">payments</span>
                    <input 
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-2xl font-headline placeholder:text-on-surface-variant/20" 
                      placeholder="50.00" 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <span className="font-label text-xs font-bold text-on-surface-variant/40 ml-2">SOL</span>
                  </div>
                </div>

                <div className="group">
                  <label className="block font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60 mb-4 group-focus-within:text-primary-fixed-dim transition-colors">03. Expiration Date</label>
                  <div className="relative flex items-center bg-surface-container-lowest border-b border-outline-variant/20 focus-within:border-primary transition-all p-4 rounded-t-xl">
                    <span className="material-symbols-outlined text-on-surface-variant/40 mr-3">calendar_today</span>
                    <input 
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-lg font-headline text-on-surface placeholder:text-on-surface-variant/20 [color-scheme:dark]" 
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                    <span className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface">Verifier Credentials</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant/60 uppercase tracking-tighter">Advanced</span>
                </div>
                <div className="space-y-4">
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:outline-none focus:border-primary-fixed-dim focus:ring-0 rounded-lg p-3 monospaced text-sm placeholder:text-on-surface-variant/20" 
                    placeholder="x25519 Public Key (Optional)" 
                    type="text"
                    value={verifierKey}
                    onChange={(e) => setVerifierKey(e.target.value)}
                  />
                  <p className="text-[11px] text-on-surface-variant/50 leading-tight">
                    If left blank, WhisperHunt will generate a unique cryptographic pair for this box. You will be prompted to save your private key upon creation.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleCreate}
                disabled={loading}
                className="w-full group relative overflow-hidden bg-primary-container py-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(0,245,255,0.1)] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-on-primary-fixed group-hover:rotate-12 transition-transform">lock</span>
                <span className="font-label font-bold text-on-primary-fixed uppercase tracking-[0.2em] text-sm">
                  {loading ? "Approving Transaction..." : "Create Bounty Box"}
                </span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 bg-surface-container-low rounded-xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              <h3 className="font-headline text-2xl font-bold mb-6 text-primary">Security Protocol</h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">shield_lock</span>
                  </div>
                  <div>
                    <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-1">Encrypted Payload</h4>
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed">Submissions are encrypted client-side using the verifier's key before touching the chain.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">account_balance_wallet</span>
                  </div>
                  <div>
                    <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-1">Escrow Lock</h4>
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed">Funds are held in a secure L1 program and only released upon cryptographic verification.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant/10">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-lg">visibility_off</span>
                  </div>
                  <div>
                    <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-1">Zero Metadata</h4>
                    <p className="text-sm text-on-surface-variant/70 leading-relaxed">No IP addresses, no browser fingerprints. Only the hash exists on the public ledger.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-8 border border-outline-variant/10 rounded-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-label text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/40">Active Network Bounties</h3>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse delay-75"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-outline-variant/5">
                  <span className="monospaced text-[10px] text-on-surface-variant/60 uppercase">box_78f2...9a</span>
                  <span className="text-xs font-bold text-primary">120 SOL</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-outline-variant/5">
                  <span className="monospaced text-[10px] text-on-surface-variant/60 uppercase">box_04d1...2e</span>
                  <span className="text-xs font-bold text-primary">45 SOL</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="monospaced text-[10px] text-on-surface-variant/60 uppercase">box_bc99...f1</span>
                  <span className="text-xs font-bold text-primary">250 SOL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-6">
          <div className="max-w-md w-full glass-panel border border-primary-container/20 p-8 rounded-xl text-center space-y-6">
            <div className="w-20 h-20 bg-tertiary-container/10 flex items-center justify-center rounded-full mx-auto">
              <span className="material-symbols-outlined text-tertiary-container text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h3 className="font-headline text-3xl font-bold">Bounty Deployed</h3>
            <p className="text-on-surface-variant text-sm">Your secure bounty box is now live on the Solana mainnet. Share this URL with your sources.</p>
            <div className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between border border-outline-variant/20">
              <span className="monospaced text-[11px] text-primary truncate mr-4">{boxUrl}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(boxUrl)}
                className="shrink-0 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
              >
                content_copy
              </button>
            </div>
            <Link href="/" className="w-full flex items-center justify-center bg-surface-container-highest py-4 rounded-lg font-label font-bold uppercase text-xs tracking-widest hover:bg-surface-bright transition-colors">
              Return to Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Mobile nav placeholder */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#111318]/80 backdrop-blur-xl border-t border-[#3a494a]/20 shadow-[0_-8px_32px_rgba(0,245,255,0.05)] md:hidden">
        <div className="flex justify-around items-center px-4 pb-6 pt-2">
          <Link className="flex flex-col items-center justify-center text-[#00F5FF] bg-[#00f5ff]/10 rounded-xl px-4 py-2 active:scale-90 transition-transform" href="/create">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>add_box</span>
            <span className="font-['Space_Grotesk'] text-[11px] font-medium tracking-widest uppercase mt-1">Create Box</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-[#e2e2e8]/40 px-4 py-2 hover:bg-[#1a1c20] hover:text-[#00F5FF]" href="#">
            <span className="material-symbols-outlined">enhanced_encryption</span>
            <span className="font-['Space_Grotesk'] text-[11px] font-medium tracking-widest uppercase mt-1">Submit Tip</span>
          </Link>
          <Link className="flex flex-col items-center justify-center text-[#e2e2e8]/40 px-4 py-2 hover:bg-[#1a1c20] hover:text-[#00F5FF]" href="#">
            <span className="material-symbols-outlined">admin_panel_settings</span>
            <span className="font-['Space_Grotesk'] text-[11px] font-medium tracking-widest uppercase mt-1">Dashboard</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
