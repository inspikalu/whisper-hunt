"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const isLanding = pathname === "/";

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-surface-container-low transition-colors duration-500">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>security</span>
          <Link href="/" className="font-headline text-on-surface tracking-tighter text-2xl font-bold text-primary-container uppercase">
            WhisperHunt
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {!isLanding ? (
            <>
              <nav className="hidden md:flex gap-8">
                <Link
                  className={`${pathname === "/create" ? "text-primary-container font-bold" : "text-on-surface/60 hover:text-primary-container"} font-label text-sm tracking-widest uppercase transition-all duration-300`}
                  href="/create"
                >
                  Create
                </Link>
                <Link
                  className={`${pathname.includes("/intelligence") ? "text-primary-container font-bold" : "text-on-surface/60 hover:text-primary-container"} font-label text-sm tracking-widest uppercase transition-all duration-300`}
                  href="/intelligence"
                >
                  Intelligence
                </Link>
                {connected && (
                  <Link
                    className={`${pathname === "/my-bounties" ? "text-primary-container font-bold" : "text-on-surface/60 hover:text-primary-container"} font-label text-sm tracking-widest uppercase transition-all duration-300`}
                    href="/my-bounties"
                  >
                    My Bounties
                  </Link>
                )}
              </nav>
              <WalletMultiButton className="!bg-primary-container !text-on-primary-fixed !px-4 !py-2 !h-auto !text-xs !font-bold !uppercase !tracking-widest !rounded-xl !transition-all" />
            </>
          ) : (
            <Link
              href="/create"
              className="bg-primary-container text-on-primary-fixed px-6 py-2 rounded-xl font-label font-bold text-xs uppercase tracking-widest hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all active:scale-95 flex items-center gap-2"
            >
              Enter App
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
