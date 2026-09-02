'use client'

import React, { useState, useMemo } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'

interface NationLeaderboardProps {
  tokens: PonsV2TokenInfo[]
  onSelectCountry: (country: CountryData) => void
  onFocusCountry: (country: CountryData) => void
}

type LeaderboardTab = 'all' | 'active'

export default function NationLeaderboard({
  tokens,
  onSelectCountry,
  onFocusCountry,
}: NationLeaderboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('all')
  const [filterQuery, setFilterQuery] = useState('')

  // Rank and process countries by Market Cap & Status
  const rankedCountries = useMemo(() => {
    return WORLD_COUNTRIES.map((c) => {
      const matchedToken = tokens.find((t) => {
        const tSym = (t.symbol || '').toUpperCase().trim()
        const tName = (t.name || '').toLowerCase().trim()
        return (
          tSym === c.symbol.toUpperCase() ||
          tSym === c.code.toUpperCase() ||
          tName === c.name.toLowerCase()
        )
      })

      const isActive = !!matchedToken
      const mcapUsd = matchedToken
        ? (matchedToken.priceUsd || (matchedToken.priceNative * 2500) || 0) * 1000000000
        : 0
      const progress = matchedToken?.progress || 0
      const priceNative = matchedToken?.priceNative || 0

      return {
        country: c,
        isActive,
        token: matchedToken || null,
        mcapUsd,
        progress,
        priceNative,
      }
    }).sort((a, b) => {
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      if (a.isActive && b.isActive) {
        return b.mcapUsd - a.mcapUsd || b.progress - a.progress
      }
      return a.country.name.localeCompare(b.country.name)
    })
  }, [tokens])

  const activeCount = useMemo(() => rankedCountries.filter((c) => c.isActive).length, [rankedCountries])

  const filteredList = useMemo(() => {
    return rankedCountries.filter((item) => {
      if (activeTab === 'active' && !item.isActive) return false
      if (filterQuery.trim()) {
        const q = filterQuery.toLowerCase().trim()
        return (
          item.country.name.toLowerCase().includes(q) ||
          item.country.symbol.toLowerCase().includes(q) ||
          item.country.code.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [rankedCountries, activeTab, filterQuery])

  // 1. Sleek Standalone Skeuomorphic Floating Trigger Button when Collapsed
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        title="Open Market Cap Leaderboard"
        className="absolute left-4 top-16 z-20 skeuo-panel px-3.5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl cursor-pointer group hover:brightness-110 active:translate-y-0.5 transition-all select-none border border-white/30"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white via-slate-200 to-slate-400 flex items-center justify-center text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_5px_rgba(0,0,0,0.7)] border border-white flex-shrink-0 text-black">
          🏆
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-mono font-black text-white tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
            LEADERBOARD
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full skeuo-led-white flex-shrink-0" />
            <span className="text-[10px] font-mono text-zinc-300">
              <strong className="text-white font-black">{activeCount}</strong> ACTIVE
            </span>
          </div>
        </div>
      </button>
    )
  }

  // 2. Full Skeuomorphic Hardware Console when Expanded
  return (
    <div className="absolute left-4 top-16 z-20 w-80 sm:w-[350px] transition-all duration-300 pointer-events-auto select-none">
      <div className="skeuo-panel rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-130px)] border border-white/30 shadow-2xl">
        {/* Console Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-black/80 bg-gradient-to-r from-white/[0.15] via-transparent to-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-white via-slate-200 to-slate-400 flex items-center justify-center text-sm shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_2px_5px_rgba(0,0,0,0.7)] border border-white flex-shrink-0 text-black">
              🏆
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white tracking-widest uppercase font-mono drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                MCAP LEADERBOARD
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full skeuo-led-white flex-shrink-0" />
                <span className="text-[10px] text-zinc-300 font-mono">
                  <strong className="text-white font-black">{activeCount}</strong> ACTIVE NATIONS
                </span>
              </div>
            </div>
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Minimize Leaderboard"
            className="w-7 h-7 rounded-lg skeuo-button text-black hover:text-zinc-700 text-xs font-black transition-all cursor-pointer flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Skeuomorphic Instrument Controls & Recessed Filter Tray */}
        <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2 border-b border-black/70 bg-black/40">
          <div className="flex items-center justify-between gap-2">
            {/* 3D Rocker Tabs */}
            <div className="flex items-center gap-1 skeuo-inset p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'skeuo-button text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ALL ({rankedCountries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'skeuo-button-white text-black shadow-md'
                    : 'text-white hover:text-zinc-200'
                }`}
              >
                ACTIVE ({activeCount})
              </button>
            </div>

            {/* Debossed Search Recess */}
            <div className="relative flex-1 max-w-[130px]">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter..."
                className="w-full skeuo-inset text-white placeholder-zinc-500 px-2.5 py-1 rounded-xl text-[10px] font-mono outline-none border border-white/20"
              />
            </div>
          </div>
        </div>

        {/* Nations List (Recessed Monitor Screen) */}
        <div className="overflow-y-auto divide-y divide-black/60 p-1.5 flex-1 max-h-[460px] skeuo-inset m-2 rounded-xl">
          {filteredList.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              // NO MATCHING TOKENS
            </div>
          ) : (
            filteredList.map((item, index) => {
              const { country, isActive, token, mcapUsd, progress } = item
              const rank = index + 1

              return (
                <div
                  key={country.code}
                  onClick={() => {
                    onFocusCountry(country)
                    onSelectCountry(country)
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-white/[0.12] via-white/[0.05] to-transparent border-t border-white/40 border-b border-black hover:brightness-125'
                      : 'hover:bg-white/[0.04] border-t border-white/[0.04] border-b border-black'
                  }`}
                >
                  {/* Left: 3D Rank Medal, Flag & Info */}
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    {/* 3D Physical Metallic Badge */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-black flex-shrink-0 shadow-sm ${
                        rank === 1
                          ? 'bg-gradient-to-b from-white via-slate-200 to-slate-400 text-black border border-white'
                          : rank === 2
                          ? 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-500 text-black border border-white'
                          : rank === 3
                          ? 'bg-gradient-to-b from-slate-400 via-slate-500 to-slate-700 text-white border border-slate-300'
                          : 'skeuo-inset text-zinc-400'
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Country Flag Badge */}
                    <div className="w-6 h-4 rounded overflow-hidden skeuo-inset p-0.5 flex items-center justify-center flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={country.flagUrl}
                        alt={country.name}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    </div>

                    {/* Country Name & Ticker */}
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white group-hover:text-zinc-200 transition-colors truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                          {country.name}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full skeuo-led-white flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400">
                        ${country.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Right: Market Cap & Tactile Action */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    {isActive && token ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-white tracking-tight drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                          ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
                        </span>
                        
                        {/* Inset Meter Bar */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 skeuo-inset rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-white via-slate-200 to-slate-400 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                              style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-white">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold text-black skeuo-button px-2 py-0.5 rounded-md">
                          LAUNCH
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Chassis Footer Trim */}
        <div className="px-3 py-2 border-t border-black/80 bg-black/50 flex items-center justify-between text-[10px] font-mono text-zinc-400">
          <span>SYS: ROBINHOOD MAINNET</span>
          <span className="text-white font-bold">● ONLINE</span>
        </div>
      </div>
    </div>
  )
}
