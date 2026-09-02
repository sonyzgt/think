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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`// ${displaySymbol} — ACTIVE NATION`}
    >
      <div className="flex flex-col gap-3 p-1 select-none font-mono">
        {/* Header: Flag, Name, Symbol, & Price Instrument Panel */}
        <div className="flex flex-col gap-3 p-3.5 skeuo-panel rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl skeuo-inset p-1 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                    {displayName}
                  </h2>
                  <span className="flex items-center gap-1 skeuo-inset px-2 py-0.5 rounded text-[9px] font-mono font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full skeuo-led-green flex-shrink-0" />
                    ACTIVE
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  ${displaySymbol} NATION TOKEN
                </span>
              </div>
            </div>

            <Link
              href={`/token/${token.tokenAddress}`}
              onClick={onClose}
              className="text-xs text-white skeuo-button px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1"
            >
              <span>CHART</span>
              <span>↗</span>
            </Link>
          </div>

          {/* Token Key Stats Instrument Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/60">
            <div className="flex flex-col p-2 rounded-lg skeuo-inset">
              <span className="text-[9px] text-zinc-400 font-mono uppercase">PRICE</span>
              <span className="text-xs font-mono font-bold text-white mt-0.5 truncate">
                {token.priceNative ? `${token.priceNative.toFixed(6)} ETH` : '~$0.0001'}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-lg skeuo-inset">
              <span className="text-[9px] text-zinc-400 font-mono uppercase">MARKET CAP</span>
              <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 truncate">
                ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-lg skeuo-inset">
              <span className="text-[9px] text-zinc-400 font-mono uppercase">CURVE</span>
              <span className="text-xs font-mono font-bold text-white mt-0.5">
                {(token.progress || 0)}%
              </span>
            </div>
          </div>

          {/* Contract Address Tray */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg skeuo-inset text-[10px]">
            <span className="text-zinc-400 font-mono truncate">
              CA: {token.tokenAddress}
            </span>
            <button
              type="button"
              onClick={copyCa}
              className="text-zinc-300 hover:text-white skeuo-button px-2 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0 cursor-pointer"
            >
              COPY
            </button>
          </div>
        </div>

        {/* Embedded Instant Swap Console Widget */}
        <div className="w-full">
          <TokenSwapWidget
            token={token}
            onSwapSuccess={onSwapSuccess}
          />
        </div>
      </div>
    </Modal>
  )
}
