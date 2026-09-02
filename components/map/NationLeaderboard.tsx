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

  // 1. Standalone Modern Floating Trigger Button when Collapsed
  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        title="Open Market Cap Leaderboard"
        className="absolute left-4 top-16 z-20 bg-white px-3.5 py-2.5 rounded-2xl flex items-center gap-3 shadow-md cursor-pointer group hover:border-[#FF6A00] transition-all select-none border border-[#D8D8D8]"
      >
        <div className="w-8 h-8 rounded-xl bg-[#FF6A00] flex items-center justify-center text-sm shadow-sm border border-[#D94F00] flex-shrink-0 text-white">
          🏆
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-mono font-black text-[#111111] tracking-wider uppercase">
            LEADERBOARD
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full skeuo-led-orange flex-shrink-0" />
            <span className="text-[10px] font-mono text-[#555555]">
              <strong className="text-[#FF6A00] font-bold">{activeCount}</strong> ACTIVE
            </span>
          </div>
        </div>
      </button>
    )
  }

  // 2. Full Modern Cartographic Console when Expanded
  return (
    <div className="absolute left-4 top-16 z-20 w-80 sm:w-[350px] transition-all duration-300 pointer-events-auto select-none">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[calc(100vh-130px)] border border-[#D8D8D8] shadow-xl">
        {/* Console Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#E2E2E2] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF6A00] flex items-center justify-center text-sm shadow-sm border border-[#D94F00] flex-shrink-0 text-white">
              🏆
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#111111] tracking-widest uppercase font-mono">
                MCAP LEADERBOARD
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full skeuo-led-orange flex-shrink-0" />
                <span className="text-[10px] text-[#777777] font-mono">
                  <strong className="text-[#FF6A00] font-bold">{activeCount}</strong> ACTIVE NATIONS
                </span>
              </div>
            </div>
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            title="Minimize Leaderboard"
            className="w-7 h-7 rounded-lg skeuo-button text-[#111111] hover:text-[#FF6A00] text-xs font-black transition-all cursor-pointer flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Filter Tray */}
        <div className="px-3 pt-2.5 pb-2 flex flex-col gap-2 border-b border-[#E2E2E2] bg-[#F5F5F3]">
          <div className="flex items-center justify-between gap-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#D8D8D8]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-[#777777] hover:text-[#111111]'
                }`}
              >
                ALL ({rankedCountries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-[#FF6A00] text-white shadow-sm'
                    : 'text-[#FF6A00] hover:bg-[#FFF0E6]'
                }`}
              >
                ACTIVE ({activeCount})
              </button>
            </div>

            {/* Search Recess */}
            <div className="relative flex-1 max-w-[130px]">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter..."
                className="w-full bg-white border border-[#D8D8D8] focus:border-[#FF6A00] text-[#111111] placeholder-zinc-400 px-2.5 py-1 rounded-xl text-[10px] font-mono outline-none shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Nations List */}
        <div className="overflow-y-auto divide-y divide-[#EFEFEF] p-1.5 flex-1 max-h-[460px] bg-white m-1 rounded-xl">
          {filteredList.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#888888] font-mono">
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
                  className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer group mb-0.5 ${
                    isActive
                      ? 'bg-[#FFF7F2] border-l-2 border-[#FF6A00] hover:bg-[#FFEBDC]'
                      : 'hover:bg-[#F5F5F3]'
                  }`}
                >
                  {/* Left: 3D Rank Medal, Flag & Info */}
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
                    {/* Rank Badge */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-black flex-shrink-0 shadow-sm ${
                        rank === 1
                          ? 'bg-[#FF6A00] text-white border border-[#D94F00]'
                          : rank === 2
                          ? 'bg-slate-200 text-[#111111] border border-slate-300'
                          : rank === 3
                          ? 'bg-amber-100 text-[#92400E] border border-amber-300'
                          : 'bg-[#F5F5F3] text-[#777777] border border-[#E2E2E2]'
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Country Flag Badge */}
                    <div className="w-6 h-4 rounded overflow-hidden border border-[#D8D8D8] p-0.5 flex items-center justify-center flex-shrink-0 bg-white shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={country.flagUrl}
                        alt={country.name}
                        className="w-full h-full object-cover rounded-xs"
                      />
                    </div>

                    {/* Country Name & Ticker */}
                    <div className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#111111] group-hover:text-[#FF6A00] transition-colors truncate">
                          {country.name}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full skeuo-led-orange flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-[#888888]">
                        ${country.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Right: Market Cap & Action */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    {isActive && token ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-mono font-bold text-[#FF6A00] tracking-tight">
                          ${mcapUsd >= 1000 ? (mcapUsd / 1000).toFixed(1) + 'k' : mcapUsd.toFixed(0)}
                        </span>
                        
                        {/* Progress Meter Bar */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-12 h-1.5 bg-[#E2E2E2] rounded-full overflow-hidden p-0.5">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6A00] to-[#FF8A22] rounded-full"
                              style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-[#555555]">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono font-bold text-[#FF6A00] bg-[#FFF0E6] border border-[#FF6A00]/30 hover:bg-[#FF6A00] hover:text-white transition-colors px-2 py-0.5 rounded-md">
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
        <div className="px-3 py-2 border-t border-[#E2E2E2] bg-[#F5F5F3] flex items-center justify-between text-[10px] font-mono text-[#777777]">
          <span>SYS: ROBINHOOD MAINNET</span>
          <span className="text-[#FF6A00] font-bold">● ONLINE</span>
        </div>
      </div>
    </div>
  )
}
