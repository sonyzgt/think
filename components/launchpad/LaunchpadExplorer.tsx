'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { PonsV2TokenInfo, getPonsTokenInfo } from '@/lib/pons-v2'
import { WORLD_COUNTRIES, CountryData } from '@/lib/countries'
import WorldFlagMap from '@/components/map/WorldFlagMap'
import CreateTokenModal from '@/components/launchpad/CreateTokenModal'
import QuickSwapModal from '@/components/token/QuickSwapModal'
import Spinner from '@/components/ui/Spinner'
import { isAddress } from 'viem'
import toast from 'react-hot-toast'
import SparkleIcon from '@/components/ui/SparkleIcon'
import Link from 'next/link'

interface LaunchpadExplorerProps {
  onOpenCreateToken: () => void
  onOpenClaimFees: () => void
  onOpenSwap: (tokenCa: string) => void
  onSelectTokenDetail: (token: PonsV2TokenInfo) => void
}

type ViewMode = 'map' | 'grid'
type StatusFilter = 'all' | 'active' | 'inactive'
type RegionFilter = 'All' | 'Americas' | 'Europe' | 'Asia' | 'Africa' | 'Oceania' | 'Middle East'

export default function LaunchpadExplorer({
  onOpenCreateToken,
  onOpenClaimFees,
  onOpenSwap,
  onSelectTokenDetail,
}: LaunchpadExplorerProps) {
  const { address } = useWallet()
  const [tokens, setTokens] = useState<PonsV2TokenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('All')
  const [customCaInput, setCustomCaInput] = useState('')
  const [lookingUpCa, setLookingUpCa] = useState(false)

  // Interactive Modal States for Country Launch & Swap
  const [selectedCountryToLaunch, setSelectedCountryToLaunch] = useState<CountryData | null>(null)
  const [selectedTokenToSwap, setSelectedTokenToSwap] = useState<PonsV2TokenInfo | null>(null)

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('pons_tokens_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTokens(parsed)
          setLoading(false)
        }
      }
    } catch { /* ignore */ }
  }, [])

  const fetchTokens = useCallback(async (showSpinner = false) => {
    if (showSpinner && tokens.length === 0) setLoading(true)
    try {
      const res = await fetch('/api/launchpad/tokens')
      if (res.ok) {
        const data = await res.json()
        if (data.tokens && Array.isArray(data.tokens)) {
          setTokens(data.tokens)
          try {
            sessionStorage.setItem('pons_tokens_cache', JSON.stringify(data.tokens))
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error('Failed to fetch launchpad tokens:', err)
    } finally {
      setLoading(false)
    }
  }, [tokens.length])

  useEffect(() => {
    fetchTokens(false)
    const interval = setInterval(() => fetchTokens(false), 5000)
    return () => clearInterval(interval)
  }, [fetchTokens])

  async function handleLookupCustomCa(e: React.FormEvent) {
    e.preventDefault()
    const clean = customCaInput.trim()
    if (!clean || !isAddress(clean)) {
      toast.error('Please enter a valid contract address (0x...)')
      return
    }

    setLookingUpCa(true)
    try {
      const info = await getPonsTokenInfo(clean)
      if (info) {
        onSelectTokenDetail(info)
        toast.success(`Found $${info.symbol} on Robinhood Chain!`)
      } else {
        toast.error('Token not found on Pons v2 factory.')
      }
    } catch (err) {
      console.error('Error looking up token:', err)
      toast.error('Failed to query token contract address.')
    } finally {
      setLookingUpCa(false)
    }
  }

  // Map each country in WORLD_COUNTRIES with its on-chain token status
  const countryItems = useMemo(() => {
    return WORLD_COUNTRIES.map((country) => {
      const matchedToken = tokens.find((t) => {
        const tSym = (t.symbol || '').toUpperCase().trim()
        const tName = (t.name || '').toLowerCase().trim()
        return (
          tSym === country.symbol.toUpperCase() ||
          tSym === country.code.toUpperCase() ||
          tName === country.name.toLowerCase()
        )
      })

      return {
        country,
        isActive: !!matchedToken,
        token: matchedToken || null,
      }
    })
  }, [tokens])

  // Compute live stats
  const activeCount = useMemo(() => countryItems.filter((c) => c.isActive).length, [countryItems])
  const inactiveCount = useMemo(() => countryItems.filter((c) => !c.isActive).length, [countryItems])
  const totalCount = WORLD_COUNTRIES.length

  // Filter countries by status, region, and search query
  const filteredCountries = useMemo(() => {
    return countryItems.filter(({ country, isActive, token }) => {
      // 1. Status Filter
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false

      // 2. Region Filter
      if (regionFilter !== 'All' && country.region !== regionFilter) return false

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchName = country.name.toLowerCase().includes(q)
        const matchSym = country.symbol.toLowerCase().includes(q)
        const matchCode = country.code.toLowerCase().includes(q)
        const matchRegion = country.region.toLowerCase().includes(q)
        const matchAddr = token?.tokenAddress?.toLowerCase().includes(q)

        if (!matchName && !matchSym && !matchCode && !matchRegion && !matchAddr) {
          return false
        }
      }

      return true
    })
  }, [countryItems, statusFilter, regionFilter, searchQuery])

  // Handle Country Click: Inactive -> Launch Modal | Active -> Quick Swap Modal
  const handleCountryClick = (country: CountryData, isActive: boolean, token: PonsV2TokenInfo | null) => {
    if (isActive && token) {
      // ACTIVE COUNTRY -> Open Quick Swap Pop-up
      setSelectedTokenToSwap(token)
    } else {
      // INACTIVE COUNTRY -> Open Pre-filled Launch Token Pop-up
      setSelectedCountryToLaunch(country)
    }
  }

  const regionsList: RegionFilter[] = ['All', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania', 'Middle East']

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* 1. Top Header Banner: World Countries Ecosystem */}
      <div className="apple-glass p-5 sm:p-7 flex flex-col gap-5 w-full relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0 shadow-sm">
              <SparkleIcon size={22} className="text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight">
                  World Nations DeFi
                </h1>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                  {activeCount} / {totalCount} Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1 leading-relaxed max-w-2xl">
                Interactive World Map with national flag territories. Click any country shape to activate its bonding curve token, or swap active nation assets.
              </p>
            </div>
          </div>

          {/* View Mode Switcher + Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-stretch sm:self-auto">
            {/* View Mode Toggle (Map vs Grid) */}
            <div className="flex items-center bg-white/[0.06] p-1 rounded-full border border-white/[0.08] shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#A1A1A6] hover:text-white'
                }`}
              >
                <span>🗺️</span>
                <span>World Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-[#A1A1A6] hover:text-white'
                }`}
              >
                <span>📑</span>
                <span>List Grid</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenCreateToken}
              className="apple-btn-primary px-4 py-2 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Custom Token</span>
            </button>
            <button
              type="button"
              onClick={onOpenClaimFees}
              className="apple-btn-secondary px-3.5 py-2 text-xs font-semibold shadow-sm cursor-pointer"
            >
              Claim Royalties
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-2 border-t border-white/[0.06] z-10">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 text-[#A1A1A6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              placeholder="Search nation on map (e.g. Brazil, Japan, USA)..."
              className="w-full apple-input pl-10 pr-4 py-2 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#6E6E73] rounded-full"
            />
          </div>

          {/* Status Tabs (All / Active / Inactive) */}
          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-full border border-white/[0.08]">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#A1A1A6] hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              🟢 Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-[#A1A1A6] hover:text-white'
              }`}
            >
              ⚪ Inactive ({inactiveCount})
            </button>
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none z-10">
          <span className="text-[11px] text-[#6E6E73] font-medium mr-1 uppercase tracking-wider flex-shrink-0">
            Region:
          </span>
          {regionsList.map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegionFilter(reg)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all flex-shrink-0 cursor-pointer ${
                regionFilter === reg
                  ? 'bg-white/[0.14] text-white border border-white/20'
                  : 'text-[#A1A1A6] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* 2. PRIMARY VIEW: 100% Interactive World Flags Map */}
      {viewMode === 'map' ? (
        <div className="w-full flex flex-col gap-3">
          <WorldFlagMap
            tokens={tokens}
            onTokenRefresh={() => fetchTokens(true)}
          />
        </div>
      ) : (
        /* Alternate Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCountries.map((item) => {
            const { country, isActive, token } = item

            return (
              <div
                key={country.code}
                onClick={() => handleCountryClick(country, isActive, token)}
                className={`apple-card-interactive p-4 sm:p-5 flex flex-col justify-between gap-4 cursor-pointer relative overflow-hidden group transition-all ${
                  isActive
                    ? 'border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.03] to-transparent'
                    : 'border-white/[0.08] hover:border-white/[0.18]'
                }`}
              >
                {/* Top Section: Flag, Country Name & Status Pill */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={country.flagUrl}
                        alt={country.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-[#F5F5F7] group-hover:text-white transition-colors truncate">
                        {country.name}
                      </span>
                      <span className="text-xs font-semibold text-[#A1A1A6]">
                        ${country.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/[0.05] text-[#A1A1A6] border border-white/[0.08] flex-shrink-0">
                      Inactive
                    </span>
                  )}
                </div>

                {/* Middle Metrics / Description */}
                {isActive && token ? (
                  <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#A1A1A6]">Price</span>
                      <span className="text-white font-mono font-medium">
                        {token.priceNative ? `${token.priceNative.toFixed(6)} ETH` : '~$0.0001'}
                      </span>
                    </div>

                    {/* Bonding curve meter */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[11px] text-[#A1A1A6]">
                        <span>Curve Progress</span>
                        <span className="text-white font-medium">{token.progress || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, token.progress || 0))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-[#A1A1A6] leading-relaxed line-clamp-2">
                    {country.description}
                  </div>
                )}

                {/* Bottom Action CTA */}
                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6E6E73] font-medium">
                    {country.region}
                  </span>

                  {isActive ? (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Swap</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white text-[#F5F5F7] hover:text-black text-xs font-semibold transition-all border border-white/[0.10] active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Tap to Launch</span>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 3. Direct Contract Address Importer Drawer */}
      <div className="apple-glass p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#A1A1A6]">
          <span className="text-white font-medium">Direct Contract Address Lookup:</span>
          <span>Find any deployed token on Robinhood Chain</span>
        </div>

        <form onSubmit={handleLookupCustomCa} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={customCaInput}
            onChange={(e) => setCustomCaInput(e.target.value)}
            placeholder="0x... contract address"
            className="apple-input px-3.5 py-1.5 text-xs text-white placeholder-zinc-500 rounded-full w-full sm:w-64"
          />
          <button
            type="submit"
            disabled={lookingUpCa || !customCaInput.trim()}
            className="apple-btn-secondary px-3.5 py-1.5 text-xs font-semibold rounded-full flex-shrink-0"
          >
            {lookingUpCa ? <Spinner size="sm" /> : 'Inspect'}
          </button>
        </form>
      </div>

      {/* 4. Pre-filled Country Launch Modal (When Inactive Country is Clicked) */}
      {selectedCountryToLaunch && (
        <CreateTokenModal
          open={!!selectedCountryToLaunch}
          onClose={() => setSelectedCountryToLaunch(null)}
          initialName={selectedCountryToLaunch.name}
          initialSymbol={selectedCountryToLaunch.symbol}
          initialLogo={selectedCountryToLaunch.flagUrl}
          initialDescription={`Official decentralized nation token for ${selectedCountryToLaunch.name} on Robinhood Chain.`}
          onTokenCreated={(tokenAddr) => {
            setSelectedCountryToLaunch(null)
            fetchTokens(true)
            toast.success(`${selectedCountryToLaunch.name} nation token launched successfully!`)
          }}
        />
      )}

      {/* 5. Quick Swap Modal (When Active Country is Clicked) */}
      {selectedTokenToSwap && (
        <QuickSwapModal
          open={!!selectedTokenToSwap}
          token={selectedTokenToSwap}
          onClose={() => setSelectedTokenToSwap(null)}
          onSwapSuccess={() => {
            fetchTokens(false)
          }}
        />
      )}
    </div>
  )
}
