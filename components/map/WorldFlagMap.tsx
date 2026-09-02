'use client'

import React, { useState, useRef, useMemo } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'
import { MAP_COUNTRY_PATHS } from '@/lib/map-paths'
import InactiveCountryModal from '@/components/map/InactiveCountryModal'
import ActiveCountryModal from '@/components/map/ActiveCountryModal'
import toast from 'react-hot-toast'

interface WorldFlagMapProps {
  tokens: PonsV2TokenInfo[]
  onTokenRefresh?: () => void
}

export default function WorldFlagMap({
  tokens,
  onTokenRefresh,
}: WorldFlagMapProps) {
  // Pan and Zoom Transform State
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Hover Tooltip State
  const [hoveredCountry, setHoveredCountry] = useState<{
    country: CountryData
    isActive: boolean
    token: PonsV2TokenInfo | null
    x: number
    y: number
  } | null>(null)

  // Active Modals
  const [selectedInactiveCountry, setSelectedInactiveCountry] = useState<CountryData | null>(null)
  const [selectedActiveCountry, setSelectedActiveCountry] = useState<{
    country: CountryData
    token: PonsV2TokenInfo
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Map each country code with its on-chain status dynamically
  const countryStatusMap = useMemo(() => {
    const map = new Map<string, { country: CountryData; isActive: boolean; token: PonsV2TokenInfo | null }>()
    
    for (const c of WORLD_COUNTRIES) {
      const matchedToken = tokens.find((t) => {
        const tSym = (t.symbol || '').toUpperCase().trim()
        const tName = (t.name || '').toLowerCase().trim()
        return (
          tSym === c.symbol.toUpperCase() ||
          tSym === c.code.toUpperCase() ||
          tName === c.name.toLowerCase()
        )
      })

      map.set(c.code.toUpperCase(), {
        country: c,
        isActive: !!matchedToken,
        token: matchedToken || null,
      })
    }

    return map
  }, [tokens])

  // Compute live real-data counts
  const totalCountries = WORLD_COUNTRIES.length
  const activeCount = useMemo(() => {
    let count = 0
    countryStatusMap.forEach((v) => { if (v.isActive) count++ })
    return count
  }, [countryStatusMap])
  const availableCount = totalCountries - activeCount

  // Search filter results for autocomplete
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return WORLD_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    ).slice(0, 6)
  }, [searchQuery])

  // Centralized Country Click Handler
  const handleCountryClick = (country: CountryData) => {
    const item = countryStatusMap.get(country.code.toUpperCase())
    if (item?.isActive && item.token) {
      // ACTIVE -> Open Token & Swap Modal
      setSelectedActiveCountry({ country, token: item.token })
      setSelectedInactiveCountry(null)
    } else {
      // INACTIVE -> Open Launch Token Modal
      setSelectedInactiveCountry(country)
      setSelectedActiveCountry(null)
    }
  }

  // Handle Zoom In / Out
  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(3.5, Math.max(0.7, prev * factor)))
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Handle Mouse Drag for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setZoom((prev) => Math.min(3.5, Math.max(0.7, prev * zoomFactor)))
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Header Toolbar: Search Bar + Live Legend */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        {/* Search Bar with Autocomplete Dropdown */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <svg
              className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
              placeholder="Search country (e.g. Brazil, Japan, USA)..."
              className="w-full bg-[#0E1318] hover:bg-[#121921] focus:bg-[#141C24] border border-white/10 focus:border-white/30 text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm transition-all outline-none shadow-sm"
            />
          </div>

          {/* Autocomplete Results Popover */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0C1217] border border-white/15 rounded-2xl p-1.5 shadow-2xl z-40 flex flex-col gap-1 backdrop-blur-2xl animate-fadeIn">
              {searchResults.map((c) => {
                const status = countryStatusMap.get(c.code.toUpperCase())
                const isActive = !!status?.isActive

                return (
                  <button
                    key={c.code}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleCountryClick(c)
                      setSearchQuery('')
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{c.flagEmoji}</span>
                      <span className="text-xs font-semibold text-white">{c.name}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">${c.symbol}</span>
                    </div>

                    {isActive ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ● ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        ○ NOT LAUNCHED
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Real Dynamic Status Legend */}
        <div className="flex items-center gap-3 bg-[#0E1318] border border-white/10 px-4 py-2.5 rounded-2xl text-xs shadow-sm self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-white font-semibold">{activeCount} Active</span>
          </div>
          <span className="text-white/15">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/30 border border-white/20" />
            <span className="text-zinc-400 font-medium">{availableCount} Available</span>
          </div>
          <span className="text-white/15 hidden md:inline">|</span>
          <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
            {totalCountries} Total Nations
          </span>
        </div>
      </div>

      {/* 2. Primary World Map Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative w-full h-[540px] sm:h-[640px] lg:h-[720px] rounded-3xl overflow-hidden bg-[#070B0E] border border-white/[0.12] shadow-2xl select-none cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #0F171F 0%, #05080B 100%)',
        }}
      >
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 bg-[#0A0E12]/85 backdrop-blur-2xl border border-white/[0.15] p-1.5 rounded-2xl shadow-2xl">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleZoom(1.25) }}
            title="Zoom In"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white text-white hover:text-black font-bold text-base transition-all active:scale-95 cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleZoom(0.8) }}
            title="Zoom Out"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white text-white hover:text-black font-bold text-base transition-all active:scale-95 cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleResetView() }}
            title="Reset Map View"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.08] hover:bg-white text-white hover:text-black text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            ⟲
          </button>
        </div>

        {/* Floating Instruction Tip */}
        <div className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-2 bg-[#0A0E12]/80 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] text-zinc-300 pointer-events-none shadow-md">
          <span>💡 Select any country on the map to Launch (Inactive) or Swap (Active)</span>
        </div>

        {/* SVG World Map */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full max-w-[1200px] max-h-[600px] drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Patterns for Country Flags */}
            <defs>
              {WORLD_COUNTRIES.map((c) => (
                <pattern
                  key={`flag-pat-${c.code}`}
                  id={`map-flag-${c.code.toLowerCase()}`}
                  patternUnits="userSpaceOnUse"
                  width="120"
                  height="80"
                >
                  <image
                    href={c.flagUrl}
                    x="0"
                    y="0"
                    width="120"
                    height="80"
                    preserveAspectRatio="xMidYMid slice"
                  />
                </pattern>
              ))}

              <filter id="map-active-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Subtle Ocean Grids */}
            <g opacity="0.06" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4,4">
              <line x1="0" y1="250" x2="1000" y2="250" />
              <line x1="500" y1="0" x2="500" y2="500" />
              <line x1="250" y1="0" x2="250" y2="500" />
              <line x1="750" y1="0" x2="750" y2="500" />
            </g>

            {/* Vector Country Shapes */}
            <g>
              {MAP_COUNTRY_PATHS.map((item) => {
                const status = countryStatusMap.get(item.code.toUpperCase())
                const country = status?.country || WORLD_COUNTRIES.find((c) => c.code === item.code)
                const isActive = !!status?.isActive
                const token = status?.token || null

                if (!country) return null

                const isMatchSearch = searchQuery.trim()
                  ? country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    country.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    country.code.toLowerCase().includes(searchQuery.toLowerCase())
                  : false

                return (
                  <g
                    key={item.code}
                    className="cursor-pointer transition-all duration-200 group"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCountryClick(country)
                    }}
                    onMouseEnter={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect()
                      if (rect) {
                        setHoveredCountry({
                          country,
                          isActive,
                          token,
                          x: e.clientX - rect.left,
                          y: e.clientY - rect.top,
                        })
                      }
                    }}
                    onMouseMove={(e) => {
                      const rect = containerRef.current?.getBoundingClientRect()
                      if (rect) {
                        setHoveredCountry((prev) =>
                          prev
                            ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
                            : null
                        )
                      }
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    {/* Country Path Shape */}
                    <path
                      d={item.d}
                      fill={`url(#map-flag-${item.code.toLowerCase()})`}
                      fillOpacity={isActive ? 1 : 0.75}
                      stroke={
                        isMatchSearch
                          ? '#0A84FF'
                          : isActive
                          ? '#30D158'
                          : 'rgba(255,255,255,0.45)'
                      }
                      strokeWidth={
                        isMatchSearch
                          ? 2.5
                          : isActive
                          ? 2
                          : 0.8
                      }
                      className="hover:stroke-white hover:stroke-[2.5px] hover:opacity-100 transition-all duration-150 filter hover:brightness-115"
                      filter={isActive ? 'url(#map-active-glow)' : undefined}
                    />

                    {/* Active Pulsing Indicator on Country Center */}
                    {isActive && item.center && (
                      <g transform={`translate(${item.center.x}, ${item.center.y})`}>
                        <circle
                          r="5.5"
                          fill="#30D158"
                          className="animate-ping opacity-75"
                        />
                        <circle
                          r="4"
                          fill="#30D158"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                        />
                      </g>
                    )}

                    {/* Country Code Label */}
                    {item.center && (
                      <text
                        x={item.center.x}
                        y={item.center.y + (isActive ? 13 : 3.5)}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        className="pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,1)]"
                      >
                        {item.code}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Minimal Country Hover Tooltip */}
        {hoveredCountry && (
          <div
            className="absolute z-30 pointer-events-none bg-[#090D11]/95 backdrop-blur-xl border border-white/15 rounded-xl px-3 py-2 shadow-2xl flex items-center gap-2.5 animate-fadeIn transition-transform"
            style={{
              left: `${Math.min(
                (containerRef.current?.clientWidth || 500) - 180,
                Math.max(12, hoveredCountry.x + 12)
              )}px`,
              top: `${Math.min(
                (containerRef.current?.clientHeight || 500) - 70,
                Math.max(12, hoveredCountry.y - 45)
              )}px`,
            }}
          >
            <span className="text-base">{hoveredCountry.country.flagEmoji}</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white tracking-tight uppercase">
                {hoveredCountry.country.name}
              </span>
              {hoveredCountry.isActive ? (
                <span className="text-[10px] font-bold text-emerald-400">
                  ● ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-medium text-zinc-400">
                  ○ NOT LAUNCHED
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Inactive Country Launch Modal Sheet */}
      {selectedInactiveCountry && (
        <InactiveCountryModal
          country={selectedInactiveCountry}
          open={!!selectedInactiveCountry}
          onClose={() => setSelectedInactiveCountry(null)}
          onLaunchSuccess={(tokenAddr) => {
            setSelectedInactiveCountry(null)
            if (onTokenRefresh) onTokenRefresh()
            toast.success(`${selectedInactiveCountry.name} nation token activated successfully!`)
          }}
        />
      )}

      {/* 4. Active Country Token & Swap Modal Sheet */}
      {selectedActiveCountry && (
        <ActiveCountryModal
          country={selectedActiveCountry.country}
          token={selectedActiveCountry.token}
          open={!!selectedActiveCountry}
          onClose={() => setSelectedActiveCountry(null)}
          onSwapSuccess={() => {
            if (onTokenRefresh) onTokenRefresh()
          }}
        />
      )}
    </div>
  )
}
