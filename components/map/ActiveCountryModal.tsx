'use client'

import React from 'react'
import Modal from '@/components/ui/Modal'
import { CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'
import TokenSwapWidget from '@/components/token/TokenSwapWidget'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ActiveCountryModalProps {
  country: CountryData | null
  token: PonsV2TokenInfo | null
  open: boolean
  onClose: () => void
  onSwapSuccess?: () => void
}

export default function ActiveCountryModal({
  country,
  token,
  open,
  onClose,
  onSwapSuccess,
}: ActiveCountryModalProps) {
  if (!token) return null

  const displayName = country?.name || token.name
  const displaySymbol = country?.symbol || token.symbol
  const flagUrl = country?.flagUrl || token.logo

  function copyCa() {
    if (token) {
      navigator.clipboard.writeText(token.tokenAddress)
      toast.success('Token contract address copied!')
    }
  }

  const mcapUsd = ((token.priceUsd || (token.priceNative * 2500) || 0) * 1000000000)
  const liquidityUsd = (token.quoteReserve ? parseFloat(token.quoteReserve) * 2500 : 50000)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`// ${displaySymbol} — ACTIVE NATION`}
    >
      <div className="flex flex-col gap-4 p-1 sm:p-2 select-none">
        {/* Header: Flag, Name, Symbol, & Price Banner */}
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-black/60 border border-white/15 p-0.5 shadow-md flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {displayName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ● ACTIVE
                  </span>
                </div>
                <span className="text-xs font-semibold text-zinc-400">
                  ${displaySymbol} TOKEN
                </span>
              </div>
            </div>

            <Link
              href={`/token/${token.tokenAddress}`}
              onClick={onClose}
              className="text-xs text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full border border-white/[0.08] transition-all font-medium flex items-center gap-1"
            >
              <span>Chart</span>
              <span>↗</span>
            </Link>
          </div>

          {/* Token Key Stats Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06]">
            <div className="flex flex-col p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Price</span>
              <span className="text-xs font-mono font-bold text-white mt-0.5">
                {token.priceNative ? `${token.priceNative.toFixed(6)} ETH` : '~$0.0001'}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Market Cap</span>
              <span className="text-xs font-mono font-bold text-white mt-0.5">
                ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Progress</span>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {token.progress || 0}%
              </span>
            </div>
          </div>

          {/* Contract Address Copy Bar */}
          <div
            onClick={copyCa}
            className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/[0.06] text-[11px] text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <span className="font-mono truncate">{token.tokenAddress}</span>
            <span className="text-[10px] bg-white/[0.08] px-2 py-0.5 rounded text-white font-medium flex-shrink-0 ml-2">
              Copy CA
            </span>
          </div>
        </div>

        {/* Real Swap Interface (Universal Router / Pons Curve) */}
        <TokenSwapWidget
          token={token}
          onSwapSuccess={() => {
            if (onSwapSuccess) onSwapSuccess()
          }}
        />
      </div>
    </Modal>
  )
}
