"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useWhisperHuntL1 } from "@/lib/anchor/anchorClient";

export default function IntelligencePage() {
  const l1Program = useWhisperHuntL1();
  const [filter, setFilter] = useState<'all' | 'live' | 'settled'>('all');
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBounties();
  }, [l1Program]);

  const fetchBounties = async () => {
    try {
      setLoading(true);
      const allBoxes = await (l1Program.account as any).bountyBox.all();
      
      const formattedBounties = allBoxes.map((box: any) => ({
        id: box.publicKey.toString().substring(0, 8).toUpperCase(),
        fullId: box.publicKey.toString(),
        title: box.account.topic || "Classified Intelligence Request",
        reward: (box.account.totalFunded.toNumber() / 1e9).toFixed(2) + " SOL",
        status: box.account.isSettled ? "Settled" : "Open",
        deadline: new Date(box.account.deadline.toNumber() * 1000),
      }));

      // Sort by open status and then by deadline
      formattedBounties.sort((a: any, b: any) => {
        if (a.status === b.status) return a.deadline - b.deadline;
        return a.status === "Open" ? -1 : 1;
      });

      setBounties(formattedBounties);
    } catch (error) {
      console.error("Failed to fetch bounties:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBounties = bounties.filter(b => {
    if (filter === 'all') return true;
    if (filter === 'live') return b.status === 'Open';
    if (filter === 'settled') return b.status === 'Settled';
    return true;
  });

  const getDeadlineText = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    if (diff < 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d left`;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h left`;
  };

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        <header className="mb-20">
          <span className="text-primary-fixed-dim font-label tracking-[0.3em] uppercase text-xs mb-4 block underline-offset-8 underline decoration-primary-container/30">Network Activity Monitor</span>
          <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-primary">
            Active <br/><span className="text-on-surface-variant/30">Intelligence Bounties.</span>
          </h2>
          <p className="mt-8 text-lg text-on-surface-variant max-w-xl leading-relaxed font-light">
            Browse and respond to active intelligence requests. All submissions are encrypted and processed through the Sentinel ER network.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-outline-variant/10 gap-6">
              <h3 className="font-headline text-2xl font-bold text-on-surface whitespace-nowrap">Intelligence Hub</h3>
              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/10">
                  <button 
                    onClick={() => setFilter('all')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setFilter('live')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'live' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                  >
                    Live
                  </button>
                  <button 
                    onClick={() => setFilter('settled')}
                    className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${filter === 'settled' ? 'bg-surface-container-highest text-primary shadow-sm' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                  >
                    Settled
                  </button>
                </div>
                <button 
                  onClick={fetchBounties}
                  className="text-[10px] uppercase tracking-[.2em] font-bold text-primary-container bg-surface-container px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors whitespace-nowrap ml-auto md:ml-0"
                >
                  <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
                  Sync Protocol
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4 opacity-50">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-surface-container-low animate-pulse rounded-xl"></div>)}
                </div>
              ) : filteredBounties.length === 0 ? (
                <div className="p-20 text-center bg-surface-container-low rounded-xl border border-outline-variant/5">
                   <p className="text-lg text-on-surface-variant italic font-light">The network is quiet. No {filter === 'all' ? '' : filter} bounties found.</p>
                </div>
              ) : (
                filteredBounties.map((bounty) => (
                  <Link key={bounty.fullId} href={`/box/${bounty.fullId}/submit`} className="group flex flex-col md:flex-row items-center justify-between p-8 bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer rounded-xl border border-transparent hover:border-primary-container/10">
                    <div className="flex items-center gap-8 w-full md:w-auto">
                      <div className="monospaced text-outline-variant text-[10px] bg-surface-container-lowest px-3 py-1 rounded">ID: #{bounty.id}</div>
                      <div>
                        <h5 className="font-headline text-xl font-bold mb-1 group-hover:text-primary transition-colors">{bounty.title}</h5>
                        <div className="flex gap-4">
                          <span className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 ${bounty.status === 'Open' ? 'text-tertiary-container' : 'text-on-surface-variant/20'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${bounty.status === 'Open' ? 'bg-tertiary-container animate-pulse' : 'bg-on-surface-variant/20'}`}></span>
                            {bounty.status}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant/40 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {getDeadlineText(bounty.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-12 mt-6 md:mt-0 w-full md:w-auto justify-between">
                      <div className="text-right">
                        <div className="monospaced text-2xl font-black text-primary">{bounty.reward}</div>
                        <div className="text-[10px] uppercase text-outline tracking-widest">Available Bounty</div>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary transition-all group-hover:translate-x-1">arrow_forward</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

       {/* Footer: "No-Line" rule */}
       <footer className="bg-surface-container-lowest pt-24 pb-12 px-12 border-t border-outline-variant/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4 text-center md:text-left">
            <h4 className="font-headline text-2xl font-bold text-primary-container uppercase tracking-tight">WhisperHunt</h4>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/40">© 2024 ENCRYPTED INTELLIGENCE PROTOCOL</p>
          </div>
          <div className="flex gap-8">
            {['Whitepaper', 'Node Status', 'DAO', 'Privacy'].map(link => (
              <Link key={link} href="#" className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors">{link}</Link>
            ))}
          </div>
        </div>
       </footer>
    </>
  );
}
