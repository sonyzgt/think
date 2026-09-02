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
    <header className="sticky top-0 z-30 w-full skeuo-panel select-none border-b border-black/90 shadow-2xl">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Physical Embossed Emblem & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center p-1.5 shadow-lg group-hover:brightness-125 transition-all border border-orange-500/30">
            <SparkleIcon size={18} className="text-orange-400 drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest text-white uppercase font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              PONSTHINK
            </span>
            <span className="text-[9px] text-orange-400 font-mono tracking-wider uppercase font-bold">
              // WORLD TOKEN MAP
            </span>
          </div>
        </Link>

        {/* Right: Tactile Network Indicator + 3D Wallet Button */}
        <div className="flex items-center gap-3">
          {/* Physical Instrument Status LED */}
          <div className="hidden sm:flex items-center gap-2 skeuo-inset px-3 py-1.5 rounded-xl text-xs border border-orange-500/20">
            <span className="w-2.5 h-2.5 rounded-full skeuo-led-orange flex-shrink-0" />
            <span className="text-orange-200 font-mono text-[11px] font-bold tracking-tight">
              ROBINHOOD #4663
            </span>
          </div>

          {/* 3D Tactile Wallet Button */}
          {authenticated && shortAddress ? (
            <button
              type="button"
              onClick={logout}
              className="skeuo-button px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-white flex items-center gap-2 cursor-pointer active:scale-95 border border-orange-500/30"
              title="Click to disconnect"
            >
              <span className="w-2 h-2 rounded-full skeuo-led-orange flex-shrink-0" />
              <span className="text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{shortAddress}</span>
              {balance?.formatted && (
                <span className="text-orange-400 pl-1.5 border-l border-white/10 hidden md:inline font-mono font-bold">
                  {parseFloat(balance.formatted).toFixed(4)} ETH
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={login}
              className="skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
