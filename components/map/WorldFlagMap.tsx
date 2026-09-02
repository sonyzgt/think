'use client'

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import { PonsV2TokenInfo } from '@/lib/pons-v2'
import { MAP_COUNTRY_PATHS } from '@/lib/map-paths'
import Spinner from '@/components/ui/Spinner'

interface WorldFlagMapProps {
  tokens: PonsV2TokenInfo[]
  onSelectCountry: (country: CountryData, isActive: boolean, token: PonsV2TokenInfo | null) => void
  searchQuery?: string
}

export default function WorldFlagMap({
  tokens,
  onSelectCountry,
  searchQuery = '',
}: WorldFlagMapProps) {
  // Pan and Zoom Transform State
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredCountry, setHoveredCountry] = useState<{
    country: CountryData
    isActive: boolean
    token: PonsV2TokenInfo | null
    x: number
    y: number
  } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Map each country code with its on-chain status
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

  // Active count for HUD
  const activeCount = useMemo(() => {
    let count = 0
    countryStatusMap.forEach((v) => { if (v.isActive) count++ })
    return count
  }, [countryStatusMap])

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
    if (e.button !== 0) return // Left click only
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

  // Touch Support for Mobile
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

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setZoom((prev) => Math.min(3.5, Math.max(0.7, prev * zoomFactor)))
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
      className="relative w-full h-[580px] sm:h-[680px] lg:h-[740px] rounded-3xl overflow-hidden bg-[#0A1118] border border-white/[0.12] shadow-2xl select-none cursor-grab active:cursor-grabbing transition-all"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #101c29 0%, #070d14 100%)',
      }}
    >
      {/* 1. Floating Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-2.5 bg-black/70 backdrop-blur-xl border border-white/10 px-3.5 py-2 rounded-2xl pointer-events-auto shadow-lg">
          <span className="text-lg">🌍</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-tight">World Nations Map</span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              {activeCount} / {WORLD_COUNTRIES.length} Nations Active
            </span>
          </div>
        </div>

        {/* Legend Indicator */}
        <div className="hidden sm:flex items-center gap-3 bg-black/70 backdrop-blur-xl border border-white/10 px-3.5 py-2 rounded-2xl pointer-events-auto text-xs shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-white font-medium text-[11px]">Active (Tap to Swap)</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white/40 border border-white/30" />
            <span className="text-zinc-300 font-medium text-[11px]">Inactive (Tap to Launch)</span>
          </div>
        </div>
      </div>

      {/* 2. Floating Zoom & Pan Control Buttons */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 bg-black/75 backdrop-blur-2xl border border-white/[0.15] p-1.5 rounded-2xl shadow-2xl">
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

      {/* 3. Floating Instruction Helper (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-2 bg-black/65 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-zinc-300 pointer-events-none shadow-md">
        <span>💡 Drag to Pan • Scroll to Zoom • Click any Country Shape to Launch / Swap</span>
      </div>

      {/* 4. Interactive SVG World Map Canvas */}
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
          {/* SVG Patterns for Country Flags */}
          <defs>
            {WORLD_COUNTRIES.map((c) => (
              <pattern
                key={`flag-pat-${c.code}`}
                id={`flag-${c.code.toLowerCase()}`}
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

            {/* Glowing filter for Active Countries */}
            <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ocean Subtle Grid Lines */}
          <g opacity="0.08" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="4,4">
            <line x1="0" y1="250" x2="1000" y2="250" />
            <line x1="500" y1="0" x2="500" y2="500" />
            <line x1="250" y1="0" x2="250" y2="500" />
            <line x1="750" y1="0" x2="750" y2="500" />
          </g>

          {/* Render Vector Country Paths with Flag Texture Fills */}
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
                    onSelectCountry(country, isActive, token)
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
                  {/* Base Country Shape Filled with Flag Pattern */}
                  <path
                    d={item.d}
                    fill={`url(#flag-${item.code.toLowerCase()})`}
                    stroke={
                      isMatchSearch
                        ? '#0A84FF'
                        : isActive
                        ? '#30D158'
                        : '#ffffff'
                    }
                    strokeWidth={
                      isMatchSearch
                        ? 2.5
                        : isActive
                        ? 1.8
                        : 0.75
                    }
                    strokeOpacity={isActive || isMatchSearch ? 1 : 0.4}
                    className="hover:stroke-white hover:stroke-[2.5px] hover:stroke-opacity-100 transition-all duration-150 filter hover:brightness-110"
                    filter={isActive ? 'url(#active-glow)' : undefined}
                  />

                  {/* Active Beacon Pulse on Country Center */}
                  {isActive && item.center && (
                    <g transform={`translate(${item.center.x}, ${item.center.y})`}>
                      <circle
                        r="5"
                        fill="#30D158"
                        className="animate-ping opacity-75"
                      />
                      <circle
                        r="3.5"
                        fill="#30D158"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    </g>
                  )}

                  {/* Country Code Label Overlay */}
                  {item.center && (
                    <text
                      x={item.center.x}
                      y={item.center.y + (isActive ? 12 : 3)}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
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

      {/* 5. Apple Liquid Glass Hover Tooltip */}
      {hoveredCountry && (
        <div
          className="absolute z-30 pointer-events-none bg-black/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2 min-w-[200px] animate-fadeIn transition-transform"
          style={{
            left: `${Math.min(
              (containerRef.current?.clientWidth || 500) - 220,
              Math.max(16, hoveredCountry.x + 15)
            )}px`,
            top: `${Math.min(
              (containerRef.current?.clientHeight || 500) - 140,
              Math.max(16, hoveredCountry.y + 15)
            )}px`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hoveredCountry.country.flagUrl}
                alt={hoveredCountry.country.name}
                className="w-6 h-4 object-cover rounded shadow-sm border border-white/20"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  {hoveredCountry.country.name}
                </span>
                <span className="text-[10px] font-semibold text-zinc-400">
                  ${hoveredCountry.country.symbol}
                </span>
              </div>
            </div>

            {/* Status Pill */}
            {hoveredCountry.isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🟢 Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-zinc-300 border border-white/10">
                ⚪ Unclaimed
              </span>
            )}
          </div>

          {/* Metrics or Action CTA */}
          {hoveredCountry.isActive && hoveredCountry.token ? (
            <div className="flex flex-col gap-1 pt-1.5 border-t border-white/10 text-[11px]">
              <div className="flex justify-between text-zinc-300">
                <span>Price:</span>
                <span className="text-white font-mono font-medium">
                  {hoveredCountry.token.priceNative ? `${hoveredCountry.token.priceNative.toFixed(6)} ETH` : '~$0.0001'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Bonding Progress:</span>
                <span className="text-emerald-400 font-bold">{hoveredCountry.token.progress || 0}%</span>
              </div>
              <div className="text-[10px] text-center font-bold text-emerald-300 mt-1 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                ⚡ Tap anywhere to Quick Swap
              </div>
            </div>
          ) : (
            <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1">
              <span className="text-[10px] text-zinc-400 line-clamp-1">
                {hoveredCountry.country.region} • Pop: {hoveredCountry.country.population || 'N/A'}
              </span>
              <div className="text-[10px] text-center font-bold text-white mt-0.5 py-1 rounded bg-white/10 border border-white/15">
                🚀 Tap anywhere to Launch & Activate
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
