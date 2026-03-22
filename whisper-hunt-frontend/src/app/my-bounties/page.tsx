"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useWhisperHuntL1,
  useWhisperHuntPER,
  getBoxPermissionsPDA
} from "@/lib/anchor/anchorClient";
import { Navbar } from "@/components/Navbar";
import { useToast, Toast } from "@/components/Toast";

export default function MyBountiesPage() {
  const { publicKey } = useWallet();
  const l1Program = useWhisperHuntL1();
  const perProgram = useWhisperHuntPER();
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, hideToast } = useToast();

  useEffect(() => {
    if (publicKey) {
      fetchMyBounties();
    } else {
      setLoading(false);
    }
  }, [publicKey, l1Program, perProgram]);

  const fetchMyBounties = async () => {
    if (!publicKey) return;
    try {
      setLoading(true);
      // Fetch all boxes where current user is the funder
      const boxes = await (l1Program.account as any).bountyBox.all([
        {
          memcmp: {
            offset: 40, // offset of 'funder' (8 discriminator + 32 box_id)
            bytes: publicKey.toBase58(),
          },
        },
      ]);

      // Fetch permissions for each box to get submission counts
      const enrichedBounties = await Promise.all(boxes.map(async (box: any) => {
        const [permPda] = getBoxPermissionsPDA(box.publicKey);
        let subCount = "0";
        try {
          const permState = await perProgram.account.boxPermissions.fetch(permPda) as any;
          subCount = permState.submissionCount.toString();
        } catch (e) {
          // Permissions might not be initialized or delegated
        }
        return {
          ...box,
          submissionCount: subCount
        };
      }));

      // Sort by newest (not explicitly tracked, but Anchor often returns in order or we can infer)
      setBounties(enrichedBounties);
    } catch (error) {
      console.error("Failed to fetch my bounties:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-28 px-6 pb-24">
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-primary font-label tracking-[0.4em] uppercase text-[10px] font-bold">Authenticated Terminal</span>
            <div className="h-[1px] bg-primary/20 flex-1"></div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="font-headline text-5xl md:text-6xl font-black tracking-tighter text-on-surface leading-none italic uppercase">
                My Active <span className="text-primary">Bounties.</span>
              </h1>
              <p className="mt-6 text-on-surface-variant max-w-2xl font-light italic opacity-60 line-clamp-2 md:line-clamp-none">
                Secure tracking of deployed intelligence vaults. Monitor real-time submissions and authorize settlements.
              </p>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-2 px-8 py-4 bg-primary-container text-on-primary-fixed rounded-xl font-headline font-black uppercase text-xs tracking-widest hover:shadow-[0_0_30px_rgba(0,245,255,0.2)] transition-all whitespace-nowrap"
            >
              Create Bounty
              <span className="material-symbols-outlined text-sm">add_circle</span>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-container-low h-64 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : !publicKey ? (
          <div className="bg-surface-container-low p-20 rounded-2xl border border-outline-variant/10 text-center space-y-8 glass-panel">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-primary/40">wallet</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-headline text-2xl font-bold">Wallet Disconnected</h2>
              <p className="text-on-surface-variant font-light italic">Please connect your authorized identity to access the mission dashboard.</p>
            </div>
          </div>
        ) : bounties.length === 0 ? (
          <div className="bg-surface-container-low p-20 rounded-2xl border border-outline-variant/10 text-center space-y-8 glass-panel">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl text-primary/40">folder_open</span>
            </div>
            <div className="space-y-4">
              <h2 className="font-headline text-2xl font-bold italic uppercase">No Deployments Found</h2>
              <p className="text-on-surface-variant font-light italic max-w-md mx-auto">You haven't deployed any intelligence vaults yet. Start a new hunt to begin gathering secure intel.</p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-container text-on-primary-fixed rounded-xl font-headline font-black uppercase text-xs tracking-widest hover:shadow-[0_0_30px_rgba(0,245,255,0.2)] transition-all"
              >
                Create New Bounty
                <span className="material-symbols-outlined text-sm">add_circle</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bounties.map((box: any) => (
              <Link
                key={box.publicKey.toString()}
                href={`/box/${box.publicKey.toString()}/dashboard`}
                className="group relative bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden transition-all hover:border-primary-container/30 hover:bg-surface-container hover:-translate-y-1 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
              >
                <div className="p-8 space-y-8">
                  <div className="flex justify-between items-start">
                    <span className="monospaced text-[10px] text-primary/60 uppercase font-bold tracking-widest">
                      BOX_{box.publicKey.toString().substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest leading-none ${box.account.isSettled ? 'bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/30' : 'bg-primary-container/10 text-primary border border-primary-container/30'}`}>
                      {box.account.isSettled ? "Settled" : "Active"}
                    </span>
                  </div>

                  <h3 className="font-headline text-2xl font-bold text-on-surface line-clamp-2 leading-tight italic uppercase opacity-90 group-hover:opacity-100 transition-opacity">
                    {box.account.topic}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant opacity-40 font-bold">Reward Pool</p>
                      <p className="font-headline text-lg font-bold text-primary italic">
                        {(box.account.totalFunded.toNumber() / 1e9).toFixed(1)} <span className="text-[10px] monospaced uppercase not-italic">SOL</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest text-on-surface-variant opacity-40 font-bold">Submissions</p>
                      <p className="font-headline text-lg font-bold text-on-surface italic">
                        {box.submissionCount.padStart(2, '0')}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-outline-variant/5 flex items-center justify-between">
                    <span className="text-[9px] monospaced text-on-surface-variant/40">
                      Ends: {new Date(box.account.deadline.toNumber() * 1000).toLocaleDateString()}
                    </span>
                    <span className="material-symbols-outlined text-primary-container opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">arrow_forward</span>
                  </div>
                </div>

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            ))}
          </div>
        )}
      </main>

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
