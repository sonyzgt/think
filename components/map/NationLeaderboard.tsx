'use client'

import React, { useState, useMemo } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'

interface NationLeaderboardProps {
  tokens: PonsV2TokenInfo[]
  onSelectCountry: (country: CountryData) => void
  onFocusCountry: (country: CountryData) => void
}

export default function NationLeaderboard({
  tokens,
  onSelectCountry,
  onFocusCountry,
}: NationLeaderboardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Rank countries by Market Cap / Activity
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

      return {
        country: c,
        isActive,
        token: matchedToken || null,
        mcapUsd,
        progress,
      }
    }).sort((a, b) => {
      // Active first, sorted by Market Cap descending
      if (a.isActive && !b.isActive) return -1
      if (!a.isActive && b.isActive) return 1
      if (a.isActive && b.isActive) {
        return b.mcapUsd - a.mcapUsd || b.progress - a.progress
      }
      return a.country.name.localeCompare(b.country.name)
    })
  }, [tokens])

  const activeCount = useMemo(() => rankedCountries.filter((c) => c.isActive).length, [rankedCountries])

  return (
    <div
      className={`absolute left-4 top-16 z-20 transition-all duration-300 pointer-events-auto select-none ${
        isCollapsed ? 'w-10' : 'w-72 sm:w-80'
      }`}
    >
      <div className="bg-[#090D12]/90 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
        {/* Leaderboard Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/10 bg-white/[0.02]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-sm">🏆</span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white tracking-tight uppercase">
                  Market Cap Leaderboard
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {activeCount} Active • Highest MCAP First
                </span>
              </div>
            </div>
          )}

          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Leaderboard' : 'Collapse Leaderboard'}
            className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/15 border border-white/10 text-zinc-300 hover:text-white text-xs transition-all cursor-pointer flex items-center justify-center"
          >
            {isCollapsed ? '🏆' : '◀'}
          </button>
        </div>

        {/* Leaderboard Nations List */}
        {!isCollapsed && (
          <div className="overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin scrollbar-thumb-white/10 p-1 flex-1">
            {rankedCountries.map((item, index) => {
              const { country, isActive, token, mcapUsd, progress } = item
              const rank = index + 1

              return (
                <div
                  key={country.code}
                  onClick={() => {
                    onFocusCountry(country)
                    onSelectCountry(country)
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.07] transition-all cursor-pointer group"
                >
                  {/* Left: Rank, Flag & Info */}
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {/* Rank Badge */}
                    <span
                      className={`w-5 text-center text-[11px] font-mono font-bold ${
                        rank === 1
                          ? 'text-yellow-400'
                          : rank === 2
                          ? 'text-zinc-300'
                          : rank === 3
                          ? 'text-amber-600'
                          : 'text-zinc-400'
                      }`}
                    >
                      #{rank}
                    </span>

                    {/* Flag */}
                    <span className="text-lg flex-shrink-0">{country.flagEmoji}</span>

                    {/* Country & Symbol */}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {country.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        ${country.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Right: MCAP / Status */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    {isActive && token ? (
                      <>
                        <span className="text-xs font-mono font-bold text-white">
                          ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] text-emerald-400 font-semibold font-mono">
                            {progress}%
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                      </>
                    ) : (
                      <span className="text-[9px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        Unclaimed
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
