import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        {/* Hero Section: Intentional Asymmetry & Breathable spacing */}
        <section className="mt-12 mb-32 grid grid-cols-1 md:grid-cols-12 gap-8 items-end border-b border-outline-variant/10 pb-32">
          <div className="md:col-span-8 pr-12">
            <span className="text-primary-fixed-dim font-label tracking-[0.3em] uppercase text-xs mb-6 block">The Silent Sentinel</span>
            <h2 className="font-headline text-5xl md:text-8xl font-bold tracking-tighter leading-[0.85] text-primary">
              Incentivize the <br/><span className="text-on-surface-variant/30">Truth Seekers.</span>
            </h2>
            <p className="mt-12 text-xl text-on-surface-variant max-w-xl leading-relaxed font-light">
              A high-security vault for decentralized intelligence. Secure, anonymous, and powered by Ephemeral Rollups. Your data is protected by the Sentinel protocol.
            </p>
            <div className="mt-12 flex flex-wrap gap-6">
              <Link href="/create" className="bg-primary-container text-on-primary-fixed px-10 py-5 text-lg font-bold uppercase tracking-widest font-headline flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all">
                Enter App
                <span className="material-symbols-outlined">launch</span>
              </Link>
              <Link href="/intelligence" className="bg-surface-container border border-outline-variant/20 text-on-surface px-10 py-5 text-lg font-bold uppercase tracking-widest font-headline flex items-center gap-3 hover:bg-surface-container-low transition-all">
                Explore Bounties
                <span className="material-symbols-outlined">security</span>
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 flex justify-end">
            <div className="w-full h-48 glass-panel rounded-xl flex items-center justify-center border border-outline-variant/10 group hover:border-primary-fixed-dim/30 transition-colors">
              <div className="text-center">
                <div className="text-primary-fixed-dim text-4xl font-headline font-bold">128.4k</div>
                <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60 mt-2">Active Network SOL</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-24">
           <div className="p-8 bg-surface-container-low rounded-xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <h3 className="font-headline text-2xl font-bold mb-8 text-primary">Sentinel Security</h3>
            <ul className="space-y-8">
              <li className="flex gap-6">
                <div className="w-12 h-12 shrink-0 bg-surface-container flex items-center justify-center rounded-lg">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-xl">shield_lock</span>
                </div>
                <div>
                  <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-2">Encrypted Payload</h4>
                  <p className="text-sm text-on-surface-variant/70 leading-relaxed">Intelligence is transformed into a cryptographic hash before leaving your machine.</p>
                </div>
              </li>
              <li className="flex gap-6">
                <div className="w-12 h-12 shrink-0 bg-surface-container flex items-center justify-center rounded-lg">
                  <span className="material-symbols-outlined text-primary-fixed-dim text-xl">bolt</span>
                </div>
                <div>
                  <h4 className="font-label text-xs font-bold uppercase tracking-wider mb-2">Ephemeral Consensus</h4>
                  <p className="text-sm text-on-surface-variant/70 leading-relaxed">Near-instant transaction finality via specialized MagicBlock rollups.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="p-8 bg-surface-container-lowest rounded-xl border border-outline-variant/10 flex flex-col justify-center">
             <div className="flex items-center justify-between mb-8">
              <h3 className="font-label text-xs tracking-widest uppercase text-on-surface-variant/60">Live Protocol Status</h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold text-primary-container">Sentinel Active</span>
              </div>
            </div>
            <p className="text-on-surface-variant font-light leading-relaxed mb-8">
              The WhisperHunt protocol ensures zero-reveal intelligence gathering. All submissions are processed within Trusted Execution Environments (TEEs) using Ephemeral Rollups for gasless, high-speed execution.
            </p>
            <div className="flex gap-4">
              <div className="monospaced text-[10px] bg-surface-container px-3 py-1 rounded">V2.1.0-STABLE</div>
              <div className="monospaced text-[10px] bg-surface-container px-3 py-1 rounded text-primary">DEVNET_ACTIVE</div>
            </div>
          </div>
        </section>
      </main>

       {/* Footer: "No-Line" rule */}
       <footer className="bg-surface-container-lowest pt-24 pb-12 px-12 border-t border-outline-variant/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
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
