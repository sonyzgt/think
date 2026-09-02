'use client'

import React, { useState, useRef, useMemo, useCallback } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'
import { MAP_COUNTRY_PATHS, MapCountryPath } from '@/lib/map-paths'
import InactiveCountryModal from '@/components/map/InactiveCountryModal'
import ActiveCountryModal from '@/components/map/ActiveCountryModal'
import NationLeaderboard from '@/components/map/NationLeaderboard'
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
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null)

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
  const [occupiedAnnouncement, setOccupiedAnnouncement] = useState<{
    country: CountryData
    symbol: string
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
  const handleCountryClick = useCallback((country: CountryData) => {
    const item = countryStatusMap.get(country.code.toUpperCase())
    if (item?.isActive && item.token) {
      setSelectedActiveCountry({ country, token: item.token })
      setSelectedInactiveCountry(null)
    } else {
      setSelectedInactiveCountry(country)
      setSelectedActiveCountry(null)
    }
  }, [countryStatusMap])

  // Focus / Pan toward a searched country
  const focusCountry = useCallback((c: CountryData) => {
    const geo = MAP_COUNTRY_PATHS.find((p) => p.code === c.code)
    if (geo && containerRef.current) {
      const targetZoom = 2.2
      const svgCenterX = geo.center.x
      const svgCenterY = geo.center.y
      
      const cx = (500 - svgCenterX) * targetZoom
      const cy = (260 - svgCenterY) * targetZoom

      setZoom(targetZoom)
      setPan({ x: cx, y: cy })
      setHighlightedCode(c.code)
      setTimeout(() => setHighlightedCode(null), 3000)
    }
  }, [])

  // Handle Zoom In / Out
  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(5, Math.max(0.8, prev * factor)))
  }

  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setHighlightedCode(null)
  }

  // Handle Mouse Drag for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Touch Support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      setPan({
        x: e.touches[0].clientX - touchStartRef.current.x,
        y: e.touches[0].clientY - touchStartRef.current.y,
      })
    }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setZoom((prev) => Math.min(5, Math.max(0.8, prev * zoomFactor)))
  }

  return (
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
      className="relative w-full h-full min-h-[calc(100vh-57px)] flex-1 overflow-hidden bg-white select-none cursor-grab active:cursor-grabbing"
    >
      {/* 1. Floating Top Overlay: Minimal Search Bar & Real Dynamic Legend */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none gap-3">
        {/* Search Bar with Autocomplete Dropdown */}
        <div className="relative w-full max-w-xs sm:max-w-sm pointer-events-auto">
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              placeholder="Search country..."
              className="w-full bg-white border border-[#D8D8D8] focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 text-[#111111] placeholder-zinc-400 pl-9 pr-3.5 py-2 rounded-xl text-xs font-mono outline-none shadow-sm transition-all"
            />
          </div>

          {/* Autocomplete Results Popover */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#D8D8D8] rounded-xl p-1.5 shadow-xl z-40 flex flex-col gap-1 animate-fadeIn">
              {searchResults.map((c) => {
                const status = countryStatusMap.get(c.code.toUpperCase())
                const isActive = !!status?.isActive

                return (
                  <button
                    key={c.code}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      focusCountry(c)
                      handleCountryClick(c)
                      setSearchQuery('')
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FFF0E6] text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flagEmoji}</span>
                      <span className="text-xs font-bold text-[#111111]">{c.name}</span>
                      <span className="text-[10px] text-[#888888] font-mono">${c.symbol}</span>
                    </div>

                    {isActive ? (
                      <span className="text-[9px] font-bold font-mono text-white bg-[#FF6A00] px-2 py-0.5 rounded shadow-sm">
                        ● ACTIVE
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-[#888888] bg-[#F5F5F3] border border-[#E2E2E2] px-2 py-0.5 rounded">
                        ○ NOT LAUNCHED
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Minimal Floating Map Legend */}
        <div className="hidden sm:flex items-center gap-3 bg-white border border-[#D8D8D8] px-3.5 py-1.5 rounded-xl text-xs shadow-sm pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full skeuo-led-orange flex-shrink-0" />
            <span className="text-[#111111] font-mono font-bold text-[11px]">{activeCount} ACTIVE</span>
          </div>
          <span className="text-[#D8D8D8]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full skeuo-led-off flex-shrink-0" />
            <span className="text-[#777777] font-mono text-[11px]">{availableCount} AVAILABLE</span>
          </div>
        </div>
      </div>

      {/* 2. Left Floating Market Cap Leaderboard */}
      <NationLeaderboard
        tokens={tokens}
        onSelectCountry={handleCountryClick}
        onFocusCountry={focusCountry}
      />

      {/* 3. Floating Tactile 3D Zoom Controls */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 bg-white border border-[#D8D8D8] p-1.5 rounded-xl shadow-md">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleZoom(1.3) }}
          title="Zoom In"
          className="w-8 h-8 flex items-center justify-center rounded-lg skeuo-button text-[#111111] font-black text-sm cursor-pointer hover:text-[#FF6A00]"
        >
          +
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleZoom(0.75) }}
          title="Zoom Out"
          className="w-8 h-8 flex items-center justify-center rounded-lg skeuo-button text-[#111111] font-black text-sm cursor-pointer hover:text-[#FF6A00]"
        >
          −
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleResetView() }}
          title="Reset Map View"
          className="w-8 h-8 flex items-center justify-center rounded-lg skeuo-button text-[#111111] text-xs font-bold cursor-pointer hover:text-[#FF6A00]"
        >
          ⟲
        </button>
      </div>

      {/* 3. True Fullscreen Geographical SVG Map Engine */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox="0 0 1000 520"
          className="w-full h-full max-w-[1500px] max-h-[850px] drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* SVG Definitions: Accurate National Flag Patterns per Country */}
          <defs>
            {MAP_COUNTRY_PATHS.map((item) => {
              const bounds = item.bounds || { minX: 0, minY: 0, maxX: 1000, maxY: 520, width: 100, height: 100 }
              const flagUrl = `https://flagcdn.com/w320/${item.code.toLowerCase()}.png`

              return (
                <React.Fragment key={`defs-${item.code}`}>
                  {/* ClipPath using the country's exact geographical SVG shape */}
                  <clipPath id={`clip-${item.code.toLowerCase()}`}>
                    <path d={item.d} />
                  </clipPath>

                  {/* Pattern to accurately fill the country bounds */}
                  <pattern
                    id={`flag-pattern-${item.code.toLowerCase()}`}
                    patternUnits="userSpaceOnUse"
                    x={bounds.minX}
                    y={bounds.minY}
                    width={bounds.width}
                    height={bounds.height}
                  >
                    <image
                      href={flagUrl}
                      x="0"
                      y="0"
                      width={bounds.width}
                      height={bounds.height}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </pattern>
                </React.Fragment>
              )
            })}

            {/* Glowing Orange Filter for Active Countries */}
            <filter id="geo-active-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#FF6A00" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Graticule / Clean Cartographic Grid */}
          <g opacity="0.45" stroke="#E5E7EB" strokeWidth="0.75" strokeDasharray="3,3">
            <line x1="0" y1="260" x2="1000" y2="260" />
            <line x1="500" y1="0" x2="500" y2="520" />
            <line x1="250" y1="0" x2="250" y2="520" />
            <line x1="750" y1="0" x2="750" y2="520" />
          </g>

          {/* Real Geographical Country Shapes with Clipped National Flags */}
          <g>
            {MAP_COUNTRY_PATHS.map((item) => {
              const status = countryStatusMap.get(item.code.toUpperCase())
              const country = status?.country || WORLD_COUNTRIES.find((c) => c.code === item.code)
              const isActive = !!status?.isActive
              const token = status?.token || null

              if (!country) return null

              const isHighlighted = highlightedCode === item.code

              return (
                <g
                  key={item.code}
                  className="cursor-pointer transition-all duration-150 group"
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
                  {/* Real Geographical Shape Filled with Flag Pattern */}
                  <path
                    d={item.d}
                    fill={`url(#flag-pattern-${item.code.toLowerCase()})`}
                    fillOpacity={isActive ? 1 : 0.82}
                    stroke={
                      isHighlighted
                        ? '#FF6A00'
                        : isActive
                        ? '#FF6A00'
                        : '#D8D8D8'
                    }
                    strokeWidth={
                      isHighlighted
                        ? 2.5
                        : isActive
                        ? 2.0
                        : 0.75
                    }
                    className="hover:stroke-[#FF6A00] hover:stroke-[2px] hover:opacity-100 transition-all duration-100 filter hover:brightness-110"
                    filter={isActive || isHighlighted ? 'url(#geo-active-glow)' : undefined}
                  />

                  {/* Active Beacon Pulse on Country Geographical Center */}
                  {isActive && item.center && (
                    <g transform={`translate(${item.center.x}, ${item.center.y})`}>
                      <circle
                        r="5"
                        fill="#FF6A00"
                        className="animate-ping opacity-75"
                      />
                      <circle
                        r="3.5"
                        fill="#FF6A00"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* 4. Clean Minimal Country Hover Tooltip */}
      {hoveredCountry && (
        <div
          className="absolute z-30 pointer-events-none bg-white border border-[#D8D8D8] rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 animate-fadeIn transition-transform"
          style={{
            left: `${Math.min(
              (containerRef.current?.clientWidth || 500) - 170,
              Math.max(12, hoveredCountry.x + 12)
            )}px`,
            top: `${Math.min(
              (containerRef.current?.clientHeight || 500) - 60,
              Math.max(12, hoveredCountry.y - 40)
            )}px`,
          }}
        >
          <span className="text-base">{hoveredCountry.country.flagEmoji}</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#111111] tracking-tight uppercase">
              {hoveredCountry.country.name}
            </span>
            {hoveredCountry.isActive ? (
              <span className="text-[10px] font-bold text-[#FF6A00]">
                ● ACTIVE
              </span>
            ) : (
              <span className="text-[10px] font-medium text-[#777777]">
                ○ NOT LAUNCHED
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5. Inactive Country Launch Modal Sheet */}
      {selectedInactiveCountry && (
        <InactiveCountryModal
          country={selectedInactiveCountry}
          open={!!selectedInactiveCountry}
          onClose={() => setSelectedInactiveCountry(null)}
          onLaunchSuccess={(tokenAddress) => {
            const launched = selectedInactiveCountry
            setSelectedInactiveCountry(null)
            if (onTokenRefresh) onTokenRefresh()
            if (launched) {
              setOccupiedAnnouncement({
                country: launched,
                symbol: launched.symbol,
              })
              focusCountry(launched)
            }
          }}
        />
      )}

      {/* 6. Active Country Token & Swap Modal Sheet */}
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

      {/* 7. Occupied Nation Pop-up Notification Announcement Modal */}
      {occupiedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn select-none font-mono">
          <div className="w-full max-w-md bg-white p-5 rounded-2xl border border-[#D8D8D8] shadow-2xl flex flex-col items-center text-center gap-4 animate-scaleUp">
            {/* Medallion */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#F5F5F3] border border-[#E2E2E2] p-1 shadow-inner flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={occupiedAnnouncement.country.flagUrl}
                  alt={occupiedAnnouncement.country.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#FF6A00] text-white shadow">
                {occupiedAnnouncement.country.code}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg">{occupiedAnnouncement.country.flagEmoji}</span>
                <h3 className="text-xl font-black text-[#111111] uppercase tracking-tight">
                  {occupiedAnnouncement.country.name} OCCUPIED!
                </h3>
              </div>
              <span className="text-xs font-mono text-[#555555]">
                Nation token <strong className="text-[#FF6A00] font-bold">${occupiedAnnouncement.symbol}</strong> is now officially active.
              </span>
            </div>

            {/* Inactivity notice */}
            <div className="w-full p-3 rounded-xl bg-[#FFF7F2] border border-[#FFE0CC] text-left flex flex-col gap-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-[#FF6A00] font-bold">
                <span>⏱️</span>
                <span>10-Minute Activity Window</span>
              </div>
              <p className="text-[#555555] font-sans leading-relaxed">
                If no buy transactions occur within 10 minutes, this nation slot will automatically reset and become available again for anyone to claim!
              </p>
            </div>

            {/* Action buttons */}
            <div className="w-full flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetCountry = occupiedAnnouncement.country
                  setOccupiedAnnouncement(null)
                  handleCountryClick(targetCountry)
                }}
                className="w-full py-2.5 px-4 rounded-xl skeuo-button-primary text-white text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                VIEW & TRADE ${occupiedAnnouncement.symbol}
              </button>
              <button
                type="button"
                onClick={() => setOccupiedAnnouncement(null)}
                className="w-full py-1.5 px-4 rounded-xl skeuo-button text-[#111111] text-xs font-mono font-bold cursor-pointer"
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
