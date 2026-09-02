'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { PonsV2TokenInfo, getPonsTokenInfo } from '@/lib/pons-v2'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { isAddress } from 'viem'
import toast from 'react-hot-toast'
import SparkleIcon from '@/components/ui/SparkleIcon'
import TokenImage from '@/components/ui/TokenImage'

interface LaunchpadExplorerProps {
  onOpenCreateToken: () => void
  onOpenClaimFees: () => void
  onOpenSwap: (tokenCa: string) => void
  onSelectTokenDetail: (token: PonsV2TokenInfo) => void
}

type TabType = 'all' | 'new' | 'graduated' | 'mine'

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
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [customCaInput, setCustomCaInput] = useState('')
  const [lookingUpCa, setLookingUpCa] = useState(false)

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

  function copyToClipboard(text: string, e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    toast.success('Contract address copied!')
  }

  const filteredTokens = useMemo(() => {
    const list = tokens.filter((t) => {
      if (activeTab === 'new' && t.graduated) return false
      if (activeTab === 'graduated' && !t.graduated) return false
      if (activeTab === 'mine') {
        if (!address) return false
        if (t.creatorAddress.toLowerCase() !== address.toLowerCase()) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchName = t.name.toLowerCase().includes(q)
        const matchSymbol = t.symbol.toLowerCase().includes(q)
        const matchAddr = t.tokenAddress.toLowerCase().includes(q)
        if (!matchName && !matchSymbol && !matchAddr) return false
      }

      return true
    })

    if (activeTab === 'graduated') {
      list.sort((a, b) => {
        const mcapA = (a.priceUsd || (a.priceNative * 2500) || 0) * 1000000000 + a.progress * 10000
        const mcapB = (b.priceUsd || (b.priceNative * 2500) || 0) * 1000000000 + b.progress * 10000
        return mcapB - mcapA
      })
    }

    return list
  }, [tokens, activeTab, searchQuery, address])

  const newCount = tokens.filter((t) => !t.graduated).length
  const graduatedCount = tokens.filter((t) => t.graduated).length
  const myCount = address ? tokens.filter((t) => t.creatorAddress.toLowerCase() === address.toLowerCase()).length : 0

  const topMcapTokens = useMemo(() => {
    if (tokens.length === 0) return []
    return [...tokens].sort((a, b) => {
      const mcapA = (a.priceUsd || (a.priceNative * 2500) || 0) * 1000000000 + a.progress * 10000
      const mcapB = (b.priceUsd || (b.priceNative * 2500) || 0) * 1000000000 + b.progress * 10000
      return mcapB - mcapA
    })
  }, [tokens])

  const [deckOffset, setDeckOffset] = useState(0)

  useEffect(() => {
    if (topMcapTokens.length <= 1) return
    const interval = setInterval(() => {
      setDeckOffset((prev) => (prev + 1) % topMcapTokens.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [topMcapTokens.length])

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn">
      {/* Top Header Row: Left Box + Right Featured Card */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch w-full">
        {/* Left Box: Title, Search & Filter Tabs */}
        <div className="flex-1 w-full apple-glass p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
                <SparkleIcon size={18} className="text-[#0A84FF]" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#F5F5F7] tracking-tight">
                Explore Tokens
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1.5 leading-relaxed">
              Fair-launch tokens with automated anti-snipe bonding curves and Uniswap v4 locked liquidity.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full">
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
              placeholder="Search token name, symbol, or 0x address..."
              className="w-full apple-input pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#6E6E73] rounded-full"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#0A84FF] text-white font-semibold shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                  : 'bg-white/[0.06] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.10] border border-white/[0.08]'
              }`}
            >
              All ({tokens.length})
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'new'
                  ? 'bg-[#0A84FF] text-white font-semibold shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                  : 'bg-white/[0.06] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.10] border border-white/[0.08]'
              }`}
            >
              Active Curve ({newCount})
            </button>
            <button
              onClick={() => setActiveTab('graduated')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'graduated'
                  ? 'bg-[#0A84FF] text-white font-semibold shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                  : 'bg-white/[0.06] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.10] border border-white/[0.08]'
              }`}
            >
              Graduated ({graduatedCount})
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'mine'
                  ? 'bg-[#0A84FF] text-white font-semibold shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                  : 'bg-white/[0.06] text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.10] border border-white/[0.08]'
              }`}
            >
              My Tokens {myCount > 0 ? `(${myCount})` : ''}
            </button>
          </div>
        </div>

        {/* Right: Featured Token Spotlight Widget */}
        <div className="w-full lg:w-[320px] xl:w-[360px] apple-glass p-4 sm:p-5 flex flex-col justify-between select-none relative group flex-shrink-0">
          {/* Top Label */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.7)] animate-pulse" />
              <span className="font-semibold text-[#F5F5F7]">Top Volume</span>
            </div>
            <span className="text-[11px] font-medium bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-full text-[#A1A1A6]">
              Robinhood L2
            </span>
          </div>

          {/* Featured Token Face */}
          {topMcapTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center gap-2 min-h-[120px]">
              <SparkleIcon size={24} className="text-[#0A84FF]" />
              <span className="text-xs text-[#A1A1A6]">Syncing Top Tokens...</span>
            </div>
          ) : (() => {
            const featuredToken = topMcapTokens[deckOffset % topMcapTokens.length]
            const mcapUsd = featuredToken.priceUsd * 1000000000
            const mcapStr =
              mcapUsd >= 1000000
                ? `$${(mcapUsd / 1000000).toFixed(2)}M`
                : mcapUsd >= 1000
                ? `$${(mcapUsd / 1000).toFixed(1)}k`
                : `$${mcapUsd.toFixed(2)}`
            const progressPct = (featuredToken.progress * 100).toFixed(1)

            return (
              <div
                key={featuredToken.tokenAddress}
                onClick={() => onSelectTokenDetail(featuredToken)}
                className="py-3 flex flex-col justify-between gap-3 cursor-pointer relative animate-fadeIn flex-1"
              >
                {/* Main Spotlight Presentation */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/[0.12] overflow-hidden shadow-md flex-shrink-0 relative group-hover:scale-105 transition-transform">
                    <TokenImage
                      src={featuredToken.logo}
                      alt={featuredToken.symbol}
                      size={56}
                      sparkleSize={28}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-[#F5F5F7]">
                        ${featuredToken.symbol}
                      </span>
                      <span className="text-[10px] font-medium text-[#30D158] bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/20">
                        {mcapStr}
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-sm font-medium text-[#A1A1A6] truncate">
                      {featuredToken.name}
                    </h3>

                    {/* Progress indicator */}
                    <div className="mt-2 flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] text-[#A1A1A6]">
                        <span>Curve Progress</span>
                        <span className="text-[#F5F5F7] font-semibold">{progressPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0A84FF] to-[#30D158] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, parseFloat(progressPct)))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Stripe */}
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08] text-xs">
                  <span className="text-[#6E6E73]">
                    Instant execution
                  </span>
                  <span className="font-semibold text-white hover:text-white bg-[#0A84FF] hover:bg-[#2492FF] px-3 py-1 rounded-full transition-colors shadow-sm text-xs">
                    Trade Now ↗
                  </span>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Main Token Grid Box */}
      <div className="flex flex-col apple-glass overflow-hidden h-[640px] sm:h-[680px] w-full flex-shrink-0">
        {/* Frame Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-white/[0.03] flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#F5F5F7] flex items-center gap-2">
              <span>Tokens on Robinhood Chain</span>
              <span className="text-xs font-normal text-[#A1A1A6]">
                ({filteredTokens.length})
              </span>
            </h2>
          </div>

          <button
            onClick={() => fetchTokens(true)}
            className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] bg-white/[0.06] hover:bg-white/[0.12] transition-all font-medium cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.08] shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Token Grid Content */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          {loading && tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] gap-3">
              <Spinner size="lg" />
              <p className="text-xs text-[#A1A1A6] font-medium">Syncing launchpad tokens...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[360px] p-6 text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
                <SparkleIcon size={24} className="text-[#0A84FF]" />
              </div>
              <div className="max-w-md">
                <p className="text-base font-bold text-[#F5F5F7]">
                  {activeTab === 'mine'
                    ? 'No Created Tokens Found'
                    : 'No Matching Tokens'}
                </p>
                <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1.5 leading-relaxed">
                  {activeTab === 'mine'
                    ? 'Deploy your first token to the bonding curve with 100% fair launch and automated graduation.'
                    : 'Be the first creator to deploy a token on Robinhood Chain using PONSTHINK!'}
                </p>
              </div>
              <Button
                size="sm"
                onClick={onOpenCreateToken}
                variant="primary"
                className="gap-2 px-5 py-2.5 text-xs font-semibold rounded-full"
              >
                + Launch Token
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTokens.map((token) => {
                const progressPct = (token.progress * 100).toFixed(1)
                const isMyToken = !!address && token.creatorAddress.toLowerCase() === address.toLowerCase()
                const marketCapUsd = token.priceUsd * 1000000000
                const marketCapFormatted =
                  marketCapUsd >= 1000000
                    ? `${(marketCapUsd / 1000000).toFixed(2)}M`
                    : marketCapUsd >= 1000
                    ? `${(marketCapUsd / 1000).toFixed(1)}k`
                    : marketCapUsd.toFixed(2)

                return (
                  <div
                    key={token.tokenAddress}
                    onClick={() => onSelectTokenDetail(token)}
                    className="flex flex-row gap-3.5 p-4 rounded-2xl apple-card-interactive cursor-pointer group relative overflow-hidden"
                  >
                    {/* Left: Square Token Thumbnail */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-black/40 border border-white/[0.12] overflow-hidden relative flex-shrink-0 flex items-center justify-center shadow-sm group-hover:border-white/30 transition-colors">
                      <TokenImage
                        src={token.logo}
                        alt={token.symbol}
                        size={72}
                        sparkleSize={48}
                        className="w-full h-full object-cover"
                      />

                      {/* Creator badge */}
                      {isMyToken && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold text-black bg-[#FFD60A] px-2 py-0.5 rounded-full shadow-sm">
                          You
                        </span>
                      )}
                    </div>

                    {/* Right: Info Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      {/* Top row: Creator & Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-[#A1A1A6] truncate">
                          <span className="text-[#6E6E73]">By</span>
                          <span className="text-[#F5F5F7] font-mono">
                            {token.creatorAddress.slice(0, 4)}...{token.creatorAddress.slice(-4)}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            token.graduated
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-white/[0.06] text-[#A1A1A6] border border-white/[0.08]'
                          }`}
                        >
                          {token.phase === 2 ? 'Uniswap V4' : 'Curve'}
                        </span>
                      </div>

                      {/* Name & Ticker */}
                      <div>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-[#F5F5F7] group-hover:text-white transition-colors truncate">
                            {token.name}
                          </span>
                          <span className="text-xs font-semibold text-[#0A84FF]">
                            ${token.symbol}
                          </span>
                        </div>

                        {token.description && (
                          <p className="text-[11px] text-[#A1A1A6] line-clamp-1 leading-tight mt-0.5">
                            {token.description}
                          </p>
                        )}
                      </div>

                      {/* Market Cap & Progress */}
                      <div className="flex flex-col gap-1 text-xs pt-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-[#F5F5F7]">
                            ${marketCapFormatted} <span className="text-[10px] text-[#A1A1A6] font-normal">MCap</span>
                          </span>
                          <span className="text-[#30D158] font-semibold text-[11px]">
                            {progressPct}%
                          </span>
                        </div>

                        {/* Apple Liquid Progress Bar */}
                        <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-[#0A84FF] to-[#30D158]"
                            style={{
                              width: `${Math.max(2, parseFloat(progressPct))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Card Footer: CA & Quick Swap Action */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.08] text-xs">
                        <div className="flex items-center gap-1 text-[#6E6E73]">
                          <span className="font-mono text-[11px]">{token.tokenAddress.slice(0, 4)}...{token.tokenAddress.slice(-4)}</span>
                          <button
                            onClick={(e) => copyToClipboard(token.tokenAddress, e)}
                            className="hover:text-[#F5F5F7] p-0.5 transition-colors cursor-pointer"
                            title="Copy Contract Address"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpenSwap(token.tokenAddress)
                          }}
                          className="px-3 py-1 rounded-full bg-white/[0.08] hover:bg-[#0A84FF] text-[#F5F5F7] hover:text-white border border-white/[0.10] text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                        >
                          <span>Swap</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
