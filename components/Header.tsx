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
    <header className="sticky top-0 z-30 w-full bg-[#080A0D] select-none border-b border-[#252A30] shadow-xl">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Physical Embossed Emblem & Title */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl skeuo-button flex items-center justify-center p-1 shadow-md group-hover:border-[#FF6A00] transition-all border border-[#343A41] overflow-hidden bg-[#15191E]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="APOLLO Logo" className="w-full h-full object-contain rounded-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black tracking-widest text-[#F5F5F5] uppercase font-mono group-hover:text-[#FF6A00] transition-colors">
              APOLLO
            </span>
            <span className="text-[9px] text-[#FF6A00] font-mono tracking-wider uppercase font-bold">
              WORLD TOKEN MAP
            </span>
          </div>
        </Link>

        {/* Right: Twitter Button + Modern Orange Wallet Button */}
        <div className="flex items-center gap-3">
          {/* Official X Logo Button */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Follow on X"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#F5F5F5] hover:text-white bg-[#15191E] hover:bg-[#1C2229] border border-[#343A41] hover:border-[#FF6A00] transition-all cursor-pointer shadow-sm active:scale-95 group"
          >
            <svg className="w-4 h-4 fill-current text-[#F5F5F5] group-hover:text-[#FF6A00] transition-colors" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* 3D Tactile Wallet Button */}
          {authenticated && shortAddress ? (
            <button
              type="button"
              onClick={logout}
              className="skeuo-button px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#F5F5F5] flex items-center gap-2 cursor-pointer active:scale-95 border border-[#343A41] bg-[#15191E] shadow-sm"
              title="Click to disconnect"
            >
              <span className="w-2 h-2 rounded-full skeuo-led-orange flex-shrink-0" />
              <span className="text-[#F5F5F5] font-black">{shortAddress}</span>
              {balance?.formatted && (
                <span className="text-[#FF6A00] pl-1.5 border-l border-[#343A41] hidden md:inline font-mono font-bold">
                  {parseFloat(balance.formatted).toFixed(4)} ETH
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={login}
              className="skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase cursor-pointer text-white shadow-lg hover:brightness-110"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
