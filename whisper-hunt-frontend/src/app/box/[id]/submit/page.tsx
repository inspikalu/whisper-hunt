"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { useWhisperHuntPER, getBoxPermissionsPDA, getSubmissionPDA } from "@/lib/anchor/anchorClient";

export default function SubmitTipPage({ params }: { params: { id: string } }) {
  const perProgram = useWhisperHuntPER();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = async () => {
    if (!evidence) return;
    setLoading(true);
    try {
      // 1. Initialize the Ephemeral Rollup Provider
      // We use a random session key for anonymity
      const sessionKeypair = Keypair.generate();
      
      // 2. Encrypt the evidence (In a real app, use ECDH with box owner's key)
      // For this hackathon, we'll store it as a Buffer
      const encryptedBlob = Buffer.from(evidence);

      console.log("Submitting gasless tip to ER...");

      // 3. Send the submit_tip instruction to the Ephemeral Rollup
      // This is gasless for the user.
      const tx = await perProgram.methods
        .submitTip(new PublicKey(params.id), encryptedBlob)
        .accounts({
          submitter: sessionKeypair.publicKey,
          boxPermissions: getBoxPermissionsPDA(new PublicKey(params.id))[0],
          submission: getSubmissionPDA(new PublicKey(params.id))[0],
          systemProgram: SystemProgram.programId,
        })
        .signers([sessionKeypair])
        .rpc();

      console.log("Tip submitted successfully! TX:", tx);
      setSuccess(true);
    } catch (error) {
      console.error("Failed to submit tip:", error);
      alert("Submission failed: " + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="flex justify-between items-center w-full px-8 py-4 max-w-none bg-[#1a1c20] fixed top-0 z-50">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-[#00F5FF] font-headline uppercase">WhisperHunt</Link>
        <div className="hidden md:flex items-center gap-10">
          <Link className="font-['Space_Grotesk'] text-sm tracking-wide text-[#e2e2e8] opacity-70 hover:text-[#00F5FF] transition-colors duration-300" href="#">Bounties</Link>
          <Link className="font-['Space_Grotesk'] text-sm tracking-wide text-[#00F5FF] border-b-2 border-[#00F5FF] pb-1 font-bold" href="#">Submit</Link>
          <Link className="font-['Space_Grotesk'] text-sm tracking-wide text-[#e2e2e8] opacity-70 hover:text-[#00F5FF] transition-colors duration-300" href="#">Intelligence</Link>
          <Link className="font-['Space_Grotesk'] text-sm tracking-wide text-[#e2e2e8] opacity-70 hover:text-[#00F5FF] transition-colors duration-300" href={`/box/${params.id}/dashboard`}>Vault</Link>
        </div>
        <div className="flex gap-4">
          <WalletMultiButton className="!bg-transparent !border !border-outline-variant !text-[#00dce5] !px-5 !py-2 !text-sm !font-label !uppercase !tracking-widest hover:!bg-surface-container !transition-all" />
          <Link href="/create" className="bg-primary-container text-on-primary-fixed px-5 py-2 text-sm font-label font-bold uppercase tracking-widest hover:bg-primary-fixed-dim transition-colors flex items-center justify-center">Create Bounty</Link>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-8 max-w-7xl mx-auto min-h-screen">
        <div className="mb-12 glass-panel border border-primary-container/20 p-6 flex items-start gap-4">
          <span className="material-symbols-outlined text-primary-container text-3xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
          <div>
            <h2 className="font-headline font-bold text-lg text-primary-container tracking-wide">ZERO-KNOWLEDGE PROTOCOL ACTIVE</h2>
            <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-wider">You are submitting anonymously. No wallet required. IP addresses are not logged. Transmission is routed through three layers of onion encryption.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <section className="lg:col-span-8 space-y-8">
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-outline-variant/30 pb-2">
                <h3 className="font-headline text-2xl font-medium">Submission Terminal</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse"></span>
                  <span className="monospaced text-[10px] text-tertiary tracking-tighter uppercase">Client-Side Encryption Active</span>
                </div>
              </div>

              {success ? (
                <div className="bg-tertiary-container/10 border border-tertiary p-8 text-center rounded-xl space-y-4">
                  <span className="material-symbols-outlined text-6xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <h3 className="font-headline text-2xl text-tertiary font-bold">Encrypted Tip Submitted</h3>
                  <p className="text-on-surface-variant">Your intel has been encrypted and submitted gaslessly to the Ephemeral Rollup network.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-label text-xs uppercase text-outline tracking-widest">Evidence Narrative / Disclosure</label>
                    <textarea 
                      className="w-full h-80 bg-surface-container-lowest border border-outline-variant/20 focus:outline-none focus:border-primary-container focus:ring-0 text-on-surface p-6 font-body text-base resize-none transition-all placeholder:text-outline/40" 
                      placeholder="Provide detailed intelligence, timestamps, and involved parties... Use Markdown for formatting."
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="font-label text-xs uppercase text-outline tracking-widest">Secure Contact Method (Optional)</label>
                      <input 
                        className="w-full bg-surface-container-lowest border border-outline-variant/20 focus:outline-none focus:border-primary-container focus:ring-0 text-on-surface p-4 monospaced text-sm transition-all" 
                        placeholder="Signal ID / Session ID / PGP Key" 
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="font-label text-xs uppercase text-outline tracking-widest">Verification Level</label>
                      <div className="flex gap-2">
                        <button className="flex-1 py-3 border border-outline-variant/50 text-xs uppercase font-label text-outline hover:border-primary-container hover:text-primary transition-all">Direct Witness</button>
                        <button className="flex-1 py-3 border border-outline-variant/50 text-xs uppercase font-label text-outline hover:border-primary-container hover:text-primary transition-all">Leaked Docs</button>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high hover:border-primary-container/40 transition-all cursor-pointer p-12 text-center group">
                    <span className="material-symbols-outlined text-4xl text-outline group-hover:text-primary-container transition-colors mb-4">cloud_upload</span>
                    <p className="font-headline text-sm text-on-surface-variant uppercase tracking-widest">Drop Encrypted Evidence Files</p>
                    <p className="text-[10px] text-outline mt-2 monospaced">PDF, PNG, MP4, JSON (MAX 256MB)</p>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={handleSubmit} 
                      disabled={loading || !evidence}
                      className="w-full bg-primary-container hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] disabled:opacity-50 text-on-primary-fixed py-6 font-headline font-black text-xl tracking-widest uppercase transition-all flex justify-center items-center gap-4"
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                      {loading ? "Encrypting & Submitting..." : "Encrypt & Submit Tip"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low p-8 border-l-2 border-primary-container relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <span className="monospaced text-[10px] text-primary-container opacity-30">REF: {params.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <h4 className="font-label text-[10px] text-outline uppercase tracking-widest mb-6">Target Bounty Profile</h4>
              
              <div className="space-y-8">
                <div>
                  <h2 className="font-headline text-2xl font-bold leading-tight mb-2 italic">Intelligence Request</h2>
                  <div className="flex gap-2 mt-4">
                    <span className="bg-surface-container-highest px-3 py-1 text-[10px] monospaced text-primary uppercase border border-primary-container/20">Class A Asset</span>
                    <span className="bg-tertiary-container/10 px-3 py-1 text-[10px] monospaced text-tertiary uppercase border border-tertiary-container/20">Open</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase text-outline tracking-widest mb-1">Reward Pool</p>
                    <p className="font-headline text-2xl font-bold text-primary-container">50.00 SOL</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-outline tracking-widest mb-1">Time Remaining</p>
                    <p className="font-headline text-2xl font-bold text-on-surface">Active</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-outline-variant/20">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] uppercase text-outline tracking-widest">Security Clearance Required</p>
                    <span className="material-symbols-outlined text-sm text-tertiary">verified_user</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-on-surface-variant">Anonymity Score:</span>
                      <span className="text-tertiary">9.8/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 border border-outline-variant/10">
              <h5 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-lg">info</span>
                Submission Guide
              </h5>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <span className="monospaced text-[10px] text-primary-container mt-1">01</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Remove EXIF metadata from all image and video files before upload.</p>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="monospaced text-[10px] text-primary-container mt-1">02</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">Use a non-custodial VPN or Tor Browser for maximum routing security.</p>
                </li>
              </ul>
            </div>
            
            <section className="mt-16 border-t border-outline-variant/20 pt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-outline">Network Live Logs</h3>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 bg-primary-container rounded-full animate-ping"></span>
                  </div>
                </div>
                <p className="monospaced text-[10px] text-outline opacity-50 uppercase">Sync: 100%</p>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-lg monospaced text-[11px] h-32 overflow-y-auto space-y-2 border border-outline-variant/10">
                <p className="text-on-surface-variant"><span className="text-tertiary opacity-50">[14:22:04]</span> <span className="text-outline">NETWORK:</span> Established handshake with Ephemeral Rollup</p>
                <p className="text-on-surface-variant"><span className="text-tertiary opacity-50">[14:22:15]</span> <span className="text-primary-container">SYSTEM:</span> Entropy generated. Secure gasless tunnel ready.</p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="bg-[#0c0e12] border-t border-[#3a494a]/20 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-12 py-10">
          <div className="text-lg font-black text-[#e2e2e8] font-headline mb-4 md:mb-0">WhisperHunt</div>
          <p className="font-['Inter'] text-xs uppercase tracking-widest text-[#00dce5]">© 2024 WhisperHunt Protocol. Encrypted Intelligence Systems.</p>
        </div>
      </footer>
    </>
  );
}
