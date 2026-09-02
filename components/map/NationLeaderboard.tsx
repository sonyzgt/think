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
      // Active first, sorted by Market Cap descending, then progress
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

  return (
    <div
      className={`absolute left-4 top-16 z-20 transition-all duration-300 pointer-events-auto select-none ${
        isCollapsed ? 'w-11' : 'w-80 sm:w-[340px]'
      }`}
    >
      <div className="bg-[#070B0E]/85 backdrop-blur-3xl border border-white/[0.12] rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col max-h-[calc(100vh-130px)] transition-all">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400/20 to-emerald-500/20 border border-amber-400/30 flex items-center justify-center text-xs shadow-inner">
                🏆
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white tracking-wider uppercase font-mono">
                  Top Nation MCAP
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  <strong className="text-emerald-400 font-bold">{activeCount}</strong> Live Nation Tokens
                </span>
              </div>
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Leaderboard' : 'Collapse Leaderboard'}
            className="w-7 h-7 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center active:scale-95 ml-auto"
          >
            {isCollapsed ? '🏆' : '✕'}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Filter Tabs & Quick Search */}
            <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2 border-b border-white/[0.06] bg-black/20">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-xl border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({rankedCountries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('active')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      activeTab === 'active'
                        ? 'bg-emerald-400 text-black shadow-sm'
                        : 'text-emerald-400/80 hover:text-emerald-300'
                    }`}
                  >
                    🟢 Active ({activeCount})
                  </button>
                </div>

                {/* Search inside leaderboard */}
                <div className="relative flex-1 max-w-[130px]">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Filter..."
                    className="w-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/10 text-white placeholder-zinc-500 px-2.5 py-1 rounded-xl text-[10px] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Nations List */}
            <div className="overflow-y-auto divide-y divide-white/[0.03] scrollbar-thin scrollbar-thumb-white/10 p-1.5 flex-1 max-h-[460px]">
              {filteredList.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No matching nation tokens found
                </div>
              ) : (
                filteredList.map((item, index) => {
                  const { country, isActive, token, mcapUsd, progress, priceNative } = item
                  const rank = index + 1

                  return (
                    <div
                      key={country.code}
                      onClick={() => {
                        onFocusCountry(country)
                        onSelectCountry(country)
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer group relative overflow-hidden mb-1 ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/[0.08] to-transparent hover:from-emerald-500/[0.15] border border-emerald-500/20 hover:border-emerald-500/40'
                          : 'hover:bg-white/[0.05] border border-transparent'
                      }`}
                    >
                      {/* Left: Rank, Flag & Info */}
                      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                        {/* Rank Badge */}
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0 ${
                            rank === 1
                              ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                              : rank === 2
                              ? 'bg-zinc-300 text-black shadow-sm'
                              : rank === 3
                              ? 'bg-amber-700 text-white shadow-sm'
                              : 'bg-white/[0.06] text-zinc-400'
                          }`}
                        >
                          {rank}
                        </div>

                        {/* Country Flag */}
                        <div className="w-6 h-4 rounded overflow-hidden bg-black/40 border border-white/15 flex items-center justify-center flex-shrink-0 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={country.flagUrl}
                            alt={country.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Country Name & Ticker */}
                        <div className="flex flex-col overflow-hidden">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                              {country.name}
                            </span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400">
                            ${country.symbol}
                          </span>
                        </div>
                      </div>

                      {/* Right: Market Cap, Progress Bar & Action */}
                      <div className="flex flex-col items-end flex-shrink-0">
                        {isActive && token ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-bold text-white tracking-tight">
                              ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
                            </span>
                            
                            {/* Curve Progress Meter */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className="w-12 h-1 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
                                />
                              </div>
                              <span className="text-[9px] font-mono font-bold text-emerald-400">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-semibold text-zinc-400 bg-white/[0.06] group-hover:bg-white group-hover:text-black border border-white/10 px-2 py-0.5 rounded-full transition-colors">
                              + Launch
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Leaderboard Footer */}
            <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between text-[10px] text-zinc-400">
              <span>Robinhood Chain Mainnet</span>
              <span className="font-mono text-zinc-400">PonsV2 Bonding Curve</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
