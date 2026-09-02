'use client'

import React from 'react'
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
    <header className="sticky top-0 z-30 w-full bg-white select-none border-b border-[#E2E2E2] shadow-sm">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Physical Embossed Emblem & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center p-1 shadow-sm group-hover:border-[#FF6A00] transition-all border border-[#D8D8D8] overflow-hidden bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ATLAS Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-widest text-[#111111] uppercase font-mono group-hover:text-[#FF6A00] transition-colors">
              ATLAS
            </span>
            <span className="text-[9px] text-[#FF6A00] font-mono tracking-wider uppercase font-bold">
              // WORLD TOKEN MAP
            </span>
          </div>
        </Link>

        {/* Right: Tactile Network Indicator + Modern Orange Wallet Button */}
        <div className="flex items-center gap-3">
          {/* Physical Instrument Status LED */}
          <div className="hidden sm:flex items-center gap-2 skeuo-inset px-3 py-1.5 rounded-xl text-xs border border-[#E2E2E2] bg-[#F5F5F3]">
            <span className="w-2.5 h-2.5 rounded-full skeuo-led-orange flex-shrink-0" />
            <span className="text-[#111111] font-mono text-[11px] font-bold tracking-tight">
              ROBINHOOD #4663
            </span>
          </div>

          {/* 3D Tactile Wallet Button */}
          {authenticated && shortAddress ? (
            <button
              type="button"
              onClick={logout}
              className="skeuo-button px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#111111] flex items-center gap-2 cursor-pointer active:scale-95 border border-[#D8D8D8] bg-white shadow-sm"
              title="Click to disconnect"
            >
              <span className="w-2 h-2 rounded-full skeuo-led-orange flex-shrink-0" />
              <span className="text-[#111111] font-black">{shortAddress}</span>
              {balance?.formatted && (
                <span className="text-[#FF6A00] pl-1.5 border-l border-[#D8D8D8] hidden md:inline font-mono font-bold">
                  {parseFloat(balance.formatted).toFixed(4)} ETH
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={login}
              className="skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer text-white shadow-md hover:brightness-105"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
