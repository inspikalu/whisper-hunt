import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <>
      <nav className="bg-[#111318] flex justify-between items-center w-full px-12 py-6 max-w-[1920px] mx-auto docked full-width top-0 z-50">
        <div className="text-2xl font-black text-[#00F5FF] tracking-tighter headline-font">WhisperHunt</div>
        <div className="hidden md:flex items-center space-x-10">
          <Link className="font-['Space_Grotesk'] tracking-tight text-sm uppercase font-bold text-[#00F5FF] border-b-2 border-[#00F5FF] pb-1" href="/">Intelligence</Link>
          <Link className="font-['Space_Grotesk'] tracking-tight text-sm uppercase font-bold text-[#e2e2e8]/60 hover:text-[#e2e2e8] transition-colors" href="#">Bounties</Link>
          <Link className="font-['Space_Grotesk'] tracking-tight text-sm uppercase font-bold text-[#e2e2e8]/60 hover:text-[#e2e2e8] transition-colors" href="#">Active Boxes</Link>
          <Link className="font-['Space_Grotesk'] tracking-tight text-sm uppercase font-bold text-[#e2e2e8]/60 hover:text-[#e2e2e8] transition-colors" href="#">Security</Link>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-[#1a1c20] text-[#e2e2e8] font-['Space_Grotesk'] text-sm uppercase font-bold px-6 py-2.5 hover:bg-[#1e2024] transition-all duration-300">
            Connect Identity
          </button>
          <Link href="/create" className="bg-primary-container text-on-primary-fixed font-['Space_Grotesk'] text-sm uppercase font-bold px-6 py-2.5 hover:shadow-[0_0_20px_rgba(0,245,255,0.3)] transition-all duration-300 active:scale-95">
            Create Box
          </Link>
        </div>
      </nav>

      <main>
        <section className="relative min-h-[921px] flex flex-col justify-center px-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-l from-primary-container/20 to-transparent"></div>
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-container/10 rounded-full blur-[120px]"></div>
          </div>
          <div className="max-w-5xl relative z-10">
            <div className="mb-6 flex items-center gap-4">
              <span className="inline-block w-12 h-[1px] bg-primary"></span>
              <span className="monospaced text-primary text-sm tracking-[0.3em] uppercase">Status: Stealth Protocol Active</span>
            </div>
            <h1 className="headline-font text-7xl md:text-8xl font-black text-on-surface leading-[0.9] tracking-tighter mb-8">
              Incentivize the <br />
              <span className="text-primary-container">Truth Seekers</span>
            </h1>
            <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-12 font-light leading-relaxed">
              The world's first decentralized intelligence hub. Secure, anonymous, and 100% on-chain. Leverage cryptographic bounties to surface the information that matters, protected by Zero-Knowledge infrastructure.
            </p>
            <div className="flex flex-wrap gap-6">
              <Link href="/create" className="bg-primary-container text-on-primary-fixed px-10 py-5 text-lg font-bold uppercase tracking-widest headline-font flex items-center gap-3 hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all">
                Create a Box
                <span className="material-symbols-outlined">add_box</span>
              </Link>
              <button className="border border-outline-variant text-on-surface px-10 py-5 text-lg font-bold uppercase tracking-widest headline-font flex items-center gap-3 hover:bg-surface-container-low transition-all">
                Submit a Tip
                <span className="material-symbols-outlined">security_update_good</span>
              </button>
            </div>
          </div>
          <div className="absolute bottom-12 right-12 text-right hidden xl:block">
            <div className="monospaced text-[10px] text-outline opacity-40 leading-relaxed uppercase tracking-widest">
              Network: Mainnet-Alpha<br />
              NodeID: 0x82f...a192<br />
              Encryption: AES-256-GCM
            </div>
          </div>
        </section>

        <section className="bg-surface-container-low py-32 px-12">
          <div className="max-w-[1920px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              </div>
              <h3 className="headline-font text-2xl font-bold uppercase tracking-tight">Zero-Knowledge Proofs</h3>
              <p className="text-on-surface-variant font-light leading-relaxed">Verify information validity without ever revealing the whistleblower's identity or the raw data source until the payout conditions are met.</p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>memory</span>
              </div>
              <h3 className="headline-font text-2xl font-bold uppercase tracking-tight">TEE-Based Decryption</h3>
              <p className="text-on-surface-variant font-light leading-relaxed">Trusted Execution Environments ensure that decryption keys are only handled in secure enclaves, preventing any third-party leaks.</p>
            </div>
            <div className="space-y-6">
              <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <h3 className="headline-font text-2xl font-bold uppercase tracking-tight">MagicBlock Rollups</h3>
              <p className="text-on-surface-variant font-light leading-relaxed">High-throughput, gasless transactions powered by specialized L3 rollups designed for near-instant cryptographic consensus.</p>
            </div>
          </div>
        </section>

        <section className="py-32 px-12">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <h2 className="headline-font text-5xl font-black uppercase tracking-tighter">The Protocol <br /><span className="text-outline">Execution Flow</span></h2>
              <div className="monospaced text-primary text-sm bg-primary/5 px-4 py-2 border-l-2 border-primary">
                VERSION 2.0.4 ACTIVE
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
              <div className="md:col-span-4 bg-surface-container p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
                <div>
                  <span className="monospaced text-primary-fixed-dim text-4xl font-bold">01</span>
                  <h4 className="headline-font text-3xl font-bold mt-6 mb-4">Fund a Box</h4>
                  <p className="text-on-surface-variant font-light">Deposit assets into a secure smart contract. Set your parameters, required proof types, and expiration dates.</p>
                </div>
                <div className="pt-8 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
                </div>
              </div>
              <div className="md:col-span-5 bg-surface-container p-10 flex flex-col justify-between group hover:bg-surface-container-high transition-colors">
                <div>
                  <span className="monospaced text-primary-fixed-dim text-4xl font-bold">02</span>
                  <h4 className="headline-font text-3xl font-bold mt-6 mb-4">Whistleblowers Submit</h4>
                  <p className="text-on-surface-variant font-light">Information is encrypted client-side and submitted via stealth addresses. Global participants can contribute evidence without detection.</p>
                </div>
                <div className="pt-8 opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-6xl">upload_file</span>
                </div>
              </div>
              <div className="md:col-span-3 bg-primary-container p-10 flex flex-col justify-between text-on-primary-fixed">
                <div>
                  <span className="monospaced text-on-primary-fixed text-4xl font-bold">03</span>
                  <h4 className="headline-font text-3xl font-bold mt-6 mb-4">Decrypt &amp; Payout</h4>
                  <p className="font-medium opacity-80">Once verified, the contract automatically releases funds. Truth is revealed, bounties are paid. Instant. Irreversible.</p>
                </div>
                <div className="pt-8">
                  <span className="material-symbols-outlined text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest py-32 px-12">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex items-center justify-between mb-16">
              <h2 className="headline-font text-4xl font-bold uppercase tracking-tight">Active Bounties</h2>
              <Link className="text-primary text-sm headline-font font-bold uppercase tracking-widest flex items-center gap-2 group" href="#">
                Explore All Bounties
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
              </Link>
            </div>
            <div className="space-y-4">
              <div className="group flex flex-col md:flex-row items-center justify-between p-8 bg-surface hover:bg-surface-container-low transition-all border-l-4 border-transparent hover:border-primary cursor-pointer">
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="monospaced text-outline-variant text-sm bg-surface-container px-3 py-1">ID: #492-AX</div>
                  <div>
                    <h5 className="headline-font text-xl font-bold mb-1">Corporate Environmental Protocol Breach</h5>
                    <div className="flex gap-4">
                      <span className="text-xs uppercase font-bold tracking-widest text-tertiary-fixed-dim flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                        Open
                      </span>
                      <span className="text-xs uppercase font-bold tracking-widest text-outline">Supply Chain Intelligence</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-12 mt-6 md:mt-0 w-full md:w-auto justify-between">
                  <div className="text-right">
                    <div className="monospaced text-2xl font-black text-primary">12,500 USDC</div>
                    <div className="text-[10px] uppercase text-outline tracking-widest">Current Reward Pool</div>
                  </div>
                  <button className="bg-surface-container-highest px-6 py-3 headline-font font-bold uppercase text-xs tracking-widest hover:bg-primary-container hover:text-on-primary-fixed transition-colors">
                    View Details
                  </button>
                </div>
              </div>
              <div className="group flex flex-col md:flex-row items-center justify-between p-8 bg-surface hover:bg-surface-container-low transition-all border-l-4 border-transparent hover:border-primary cursor-pointer">
                <div className="flex items-center gap-8 w-full md:w-auto">
                  <div className="monospaced text-outline-variant text-sm bg-surface-container px-3 py-1">ID: #108-KK</div>
                  <div>
                    <h5 className="headline-font text-xl font-bold mb-1">Unreported Smart Contract Exploit Intel</h5>
                    <div className="flex gap-4">
                      <span className="text-xs uppercase font-bold tracking-widest text-tertiary-fixed-dim flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim animate-pulse"></span>
                        Open
                      </span>
                      <span className="text-xs uppercase font-bold tracking-widest text-outline">DeFi Security</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-12 mt-6 md:mt-0 w-full md:w-auto justify-between">
                  <div className="text-right">
                    <div className="monospaced text-2xl font-black text-primary">45,000 USDC</div>
                    <div className="text-[10px] uppercase text-outline tracking-widest">Current Reward Pool</div>
                  </div>
                  <button className="bg-surface-container-highest px-6 py-3 headline-font font-bold uppercase text-xs tracking-widest hover:bg-primary-container hover:text-on-primary-fixed transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-40 px-12 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="headline-font text-6xl font-black mb-8 leading-tight">Ready to expose the <br />unseen?</h2>
            <p className="text-on-surface-variant text-xl mb-12 max-w-2xl mx-auto">Start your hunt today. Deploy your bounty box or submit a tip through our encrypted gateway.</p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link href="/create" className="bg-primary-container text-on-primary-fixed w-full md:w-auto px-12 py-5 text-xl font-black uppercase headline-font">Launch App</Link>
              <button className="text-on-surface hover:text-primary transition-colors headline-font font-bold uppercase tracking-[0.2em]">Review Whitepaper</button>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-container/5 to-transparent pointer-events-none"></div>
        </section>
      </main>

      <footer className="bg-[#0c0e12] border-t border-[#3a494a]/20 flex flex-col md:flex-row justify-between items-center w-full px-12 py-10 gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="text-lg font-bold text-[#e2e2e8] headline-font">WhisperHunt</div>
          <p className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40">© 2024 WhisperHunt. Encrypted Intelligence Protocol.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">Whitepaper</Link>
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">Node Status</Link>
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">Audit Logs</Link>
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">DAO Governance</Link>
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">Privacy</Link>
          <Link className="font-['Inter'] text-xs tracking-widest uppercase text-[#e2e2e8]/40 hover:text-[#00F5FF] transition-colors duration-200" href="#">Contact</Link>
        </div>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all cursor-pointer">
            <span className="material-symbols-outlined text-sm">public</span>
          </div>
          <div className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-outline hover:text-primary hover:border-primary transition-all cursor-pointer">
            <span className="material-symbols-outlined text-sm">terminal</span>
          </div>
        </div>
      </footer>
    </>
  );
}
