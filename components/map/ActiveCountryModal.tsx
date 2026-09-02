'use client'

import React, { useState, useEffect } from 'react'
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
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null)

  useEffect(() => {
    if (!token?.expiresAt || (token.progress || 0) > 0) {
      setTimeLeftSec(null)
      return
    }

    function update() {
      if (!token?.expiresAt) return
      const diff = Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000))
      setTimeLeftSec(diff)
    }

    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [token?.expiresAt, token?.progress])

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
  const isStagnant = (token.progress || 0) <= 0 && timeLeftSec !== null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`// ${displaySymbol} — ACTIVE NATION`}
    >
      <div className="flex flex-col gap-3 p-1 select-none font-mono text-[#111111]">
        {/* Inactivity Grace Period / Reset Alert Banner */}
        {isStagnant && timeLeftSec !== null && (
          <div className="p-3 rounded-xl bg-[#FFF7F2] border border-[#FFE0CC] flex items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[#FF6A00] font-bold">
                <span className="animate-pulse">⏱️</span>
                <span>INACTIVITY AUTO-RESET TIMER</span>
              </div>
              <span className="text-[10px] text-[#777777] font-sans mt-0.5">
                If 0 buys occur within 10m of launch, this country resets & re-opens.
              </span>
            </div>
            <div className="flex items-center justify-center bg-white px-2.5 py-1.5 rounded-lg border border-[#FFE0CC] shadow-xs">
              <span className="text-sm font-black font-mono text-[#FF6A00] tracking-wider">
                {Math.floor(timeLeftSec / 60).toString().padStart(2, '0')}:
                {(timeLeftSec % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {/* Header: Flag, Name, Symbol, & Price Instrument Panel */}
        <div className="flex flex-col gap-3 p-3.5 bg-white border border-[#D8D8D8] rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F5F5F3] border border-[#E2E2E2] p-1 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={flagUrl}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight uppercase">
                    {displayName}
                  </h2>
                  <span className="flex items-center gap-1 bg-[#FFF0E6] border border-[#FF6A00]/30 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-[#FF6A00]">
                    <span className="w-1.5 h-1.5 rounded-full skeuo-led-orange flex-shrink-0" />
                    ACTIVE
                  </span>
                </div>
                <span className="text-xs font-mono text-[#777777]">
                  ${displaySymbol} NATION TOKEN
                </span>
              </div>
            </div>

            <Link
              href={`/token/${token.tokenAddress}`}
              onClick={onClose}
              className="text-xs text-[#111111] skeuo-button px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1 hover:text-[#FF6A00]"
            >
              <span>CHART</span>
              <span>↗</span>
            </Link>
          </div>

          {/* Token Key Stats Instrument Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EFEFEF]">
            <div className="flex flex-col p-2 rounded-lg bg-[#F5F5F3] border border-[#E2E2E2]">
              <span className="text-[9px] text-[#777777] font-mono uppercase">PRICE</span>
              <span className="text-xs font-mono font-bold text-[#111111] mt-0.5 truncate">
                {token.priceNative ? `${token.priceNative.toFixed(6)} ETH` : '~$0.0001'}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-lg bg-[#F5F5F3] border border-[#E2E2E2]">
              <span className="text-[9px] text-[#777777] font-mono uppercase">MARKET CAP</span>
              <span className="text-xs font-mono font-bold text-[#FF6A00] mt-0.5 truncate">
                ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
              </span>
            </div>

            <div className="flex flex-col p-2 rounded-lg bg-[#F5F5F3] border border-[#E2E2E2]">
              <span className="text-[9px] text-[#777777] font-mono uppercase">CURVE</span>
              <span className="text-xs font-mono font-bold text-[#111111] mt-0.5">
                {(token.progress || 0)}%
              </span>
            </div>
          </div>

          {/* Contract Address Tray */}
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#F5F5F3] border border-[#E2E2E2] text-[10px]">
            <span className="text-[#777777] font-mono truncate">
              CA: {token.tokenAddress}
            </span>
            <button
              type="button"
              onClick={copyCa}
              className="text-[#111111] skeuo-button px-2 py-0.5 rounded text-[9px] font-mono font-bold flex-shrink-0 cursor-pointer hover:text-[#FF6A00]"
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
