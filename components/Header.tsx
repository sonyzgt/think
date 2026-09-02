'use client'

import React from 'react'
import SparkleIcon from '@/components/ui/SparkleIcon'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import Link from 'next/link'

export default function Header() {
  const { authenticated, login, logout, user } = usePrivy()
  const { address, balance } = useWallet()

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : user?.wallet?.address
    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
    : null

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#050506]/85 backdrop-blur-2xl select-none">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center shadow-sm group-hover:bg-white/[0.10] transition-colors">
            <SparkleIcon size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-mono">
              PONSTHINK
            </span>
            <span className="text-[10px] text-zinc-400 font-medium tracking-tight">
              World Token Map
            </span>
          </div>
        </Link>

        {/* Right: Network Status + Wallet Connect Button */}
        <div className="flex items-center gap-3">
          {/* Network Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-zinc-200 font-medium text-[11px]">Robinhood Chain</span>
          </div>

          {/* Wallet Button */}
          {authenticated && shortAddress ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-white transition-all cursor-pointer"
                title="Click to disconnect"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{shortAddress}</span>
                {balance?.formatted && (
                  <span className="text-zinc-400 font-normal pl-1 border-l border-white/10 hidden md:inline">
                    {parseFloat(balance.formatted).toFixed(4)} ETH
                  </span>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="px-4 py-1.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
