'use client'

import React, { useState, useEffect } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { getRecentSwapLogs, SwapEventPayload } from '@/lib/swap-events'

interface LiveSwapLogPanelProps {
  onSelectCountry: (country: CountryData) => void
  onFocusCountry: (country: CountryData) => void
}

export default function LiveSwapLogPanel({
  onSelectCountry,
  onFocusCountry,
}: LiveSwapLogPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [swapLogs, setSwapLogs] = useState<SwapEventPayload[]>([])

  useEffect(() => {
    setSwapLogs(getRecentSwapLogs())

    const handleNewSwap = (e: Event) => {
      const customEvent = e as CustomEvent<SwapEventPayload>
      if (customEvent.detail) {
        setSwapLogs((prev) => [customEvent.detail, ...prev].slice(0, 40))
      }
    }

    window.addEventListener('apollo_token_swap', handleNewSwap)
    return () => {
      window.removeEventListener('apollo_token_swap', handleNewSwap)
    }
  }, [])

  const formatTimeAgo = (ts?: number) => {
    if (!ts) return 'just now'
    const diff = Math.floor((Date.now() - ts) / 1000)
    if (diff < 15) return 'just now'
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  // 1. Collapsed Floating Badge
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        title="Open Live Swap Log Feed"
        className="bg-[#0B0E12] px-3 py-2 rounded-xl flex items-center gap-2.5 shadow-2xl cursor-pointer group hover:border-[#38BDF8] transition-all select-none border border-[#2A3036] pointer-events-auto"
      >
        <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 flex items-center justify-center text-xs flex-shrink-0 font-bold">
          ⚡
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-mono font-black text-[#F2F2F2] tracking-wider uppercase group-hover:text-[#38BDF8] transition-colors">
            SWAP LOGS
          </span>
          <span className="text-[9px] font-mono text-[#8A929B]">
            {swapLogs.length > 0 ? `${swapLogs.length} RECORDED` : 'WAITING FOR SWAPS'}
          </span>
        </div>
      </button>
    )
  }

  // 2. Expanded Standalone Live Swap Log Panel
  return (
    <div className="w-80 sm:w-[350px] transition-all duration-300 pointer-events-auto select-none">
      <div className="bg-[#0B0E12] rounded-2xl overflow-hidden flex flex-col border border-[#2A3036] shadow-2xl">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#20252B] bg-[#080A0D]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40 flex items-center justify-center text-xs flex-shrink-0 font-bold">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#F2F2F2] tracking-widest uppercase font-mono">
                LIVE SWAP FEED
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse flex-shrink-0" />
                <span className="text-[9px] font-mono text-[#8A929B]">
                  SYNCHRONIZED REALTIME
                </span>
              </div>
            </div>
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Minimize Swap Logs"
            className="w-6 h-6 rounded-lg skeuo-button text-[#E5E7E9] hover:text-[#38BDF8] text-xs font-black transition-all cursor-pointer flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Swap Logs List */}
        <div className="overflow-y-auto divide-y divide-[#20252B] p-1.5 max-h-[220px] bg-[#0B0E12]">
          {swapLogs.length === 0 ? (
            <div className="py-8 px-4 flex flex-col items-center justify-center text-center gap-1.5">
              <span className="text-xl opacity-30">⚡</span>
              <span className="text-[11px] text-[#8A929B] font-mono font-bold">
                NO SWAPS RECORDED YET
              </span>
              <p className="text-[9px] text-[#5A626C] font-mono leading-relaxed">
                Swaps and trades executed on the world map will appear here live with animated cross-border laser beams.
              </p>
            </div>
          ) : (
            swapLogs.map((log, idx) => {
              const targetCountry = WORLD_COUNTRIES.find(
                (c) => c.code.toUpperCase() === log.toCountry.toUpperCase()
              )
              const originCountry = WORLD_COUNTRIES.find(
                (c) => c.code.toUpperCase() === log.fromCountry?.toUpperCase()
              )

              const isBuy = log.type === 'BUY'
              const isSell = log.type === 'SELL'

              return (
                <div
                  key={log.id || `swap-log-${idx}`}
                  onClick={() => {
                    if (targetCountry) {
                      onFocusCountry(targetCountry)
                      onSelectCountry(targetCountry)
                    }
                  }}
                  className="p-2 rounded-lg bg-[#15191E]/70 hover:bg-[#1C2229] border border-[#20252B] hover:border-[#38BDF8]/40 transition-all cursor-pointer flex flex-col gap-1 mb-0.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    {/* Flags: Origin ➔ Target */}
                    <div className="flex items-center gap-1.5">
                      {/* Origin Flag */}
                      <div className="w-5 h-3.5 rounded overflow-hidden border border-[#2A3036] bg-[#080A0D] flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={originCountry?.flagUrl || `https://flagcdn.com/w40/${(log.fromCountry || 'us').toLowerCase()}.png`}
                          alt={log.fromCountry || 'Origin'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#8A929B]">
                        {log.fromCountry}
                      </span>

                      <span className="text-[#38BDF8] text-[9px] font-bold">➔</span>

                      {/* Target Flag */}
                      <div className="w-5 h-3.5 rounded overflow-hidden border border-[#FF6A00]/50 bg-[#080A0D] flex-shrink-0 shadow-[0_0_8px_rgba(255,106,0,0.3)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={targetCountry?.flagUrl || `https://flagcdn.com/w40/${log.toCountry.toLowerCase()}.png`}
                          alt={log.toCountry}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-mono font-black text-[#F2F2F2] group-hover:text-[#FF6A00] transition-colors">
                        {log.toCountry} (${log.tokenSymbol || log.toCountry})
                      </span>
                    </div>

                    {/* Action Badge */}
                    <span
                      className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md border ${
                        isBuy
                          ? 'bg-[#FF6A00]/20 text-[#FF6A00] border-[#FF6A00]/40'
                          : isSell
                          ? 'bg-[#FF334B]/20 text-[#FF334B] border-[#FF334B]/40'
                          : 'bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/40'
                      }`}
                    >
                      {log.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8A929B] pt-0.5 border-t border-[#20252B]/60">
                    <span className="text-[#F2F2F2] font-bold">
                      {log.amount}
                    </span>
                    <span className="text-[9px] text-[#5A626C]">
                      {formatTimeAgo(log.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
