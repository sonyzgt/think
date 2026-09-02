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
    <header className="sticky top-0 z-30 w-full skeuo-panel select-none border-b border-white/20 shadow-2xl">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Physical Embossed Emblem & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center p-1.5 shadow-lg group-hover:brightness-110 transition-all border border-white/30">
            <SparkleIcon size={18} className="text-black drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white uppercase font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              ATLAS
            </span>
            <span className="text-[9px] text-zinc-300 font-mono tracking-wider uppercase font-bold">
              // WORLD TOKEN MAP
            </span>
          </div>
        </Link>

        {/* Right: Tactile Network Indicator + 3D Wallet Button */}
        <div className="flex items-center gap-3">
          {/* Physical Instrument Status LED */}
          <div className="hidden sm:flex items-center gap-2 skeuo-inset px-3 py-1.5 rounded-xl text-xs border border-white/20">
            <span className="w-2.5 h-2.5 rounded-full skeuo-led-white flex-shrink-0" />
            <span className="text-white font-mono text-[11px] font-bold tracking-tight">
              ROBINHOOD #4663
            </span>
          </div>

          {/* 3D Tactile Wallet Button */}
          {authenticated && shortAddress ? (
            <button
              type="button"
              onClick={logout}
              className="skeuo-button px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-black flex items-center gap-2 cursor-pointer active:scale-95 border border-white/40"
              title="Click to disconnect"
            >
              <span className="w-2 h-2 rounded-full skeuo-led-white flex-shrink-0" />
              <span className="text-black font-black">{shortAddress}</span>
              {balance?.formatted && (
                <span className="text-zinc-700 pl-1.5 border-l border-black/20 hidden md:inline font-mono font-bold">
                  {parseFloat(balance.formatted).toFixed(4)} ETH
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={login}
              className="skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer text-black"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
