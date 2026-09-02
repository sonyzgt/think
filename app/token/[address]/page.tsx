'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getAddress, isAddress, formatEther } from 'viem'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import { getPonsTokenInfo, PonsV2TokenInfo } from '@/lib/pons-v2'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import TokenPriceChart from '@/components/token/TokenPriceChart'
import TokenSwapWidget from '@/components/token/TokenSwapWidget'
import ClaimFeesModal from '@/components/launchpad/ClaimFeesModal'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'
import SparkleIcon from '@/components/ui/SparkleIcon'
import TokenImage from '@/components/ui/TokenImage'

interface PageProps {
  params: Promise<{ address: string }>
}

export default function TokenDetailPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const rawAddress = resolvedParams.address

  const { logout } = usePrivy()
  const { address: userAddress, refetchBalance } = useWallet()
  const { theme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  const [token, setToken] = useState<PonsV2TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'trades'>('overview')
  const [claimFeesOpen, setClaimFeesOpen] = useState(false)

  const cleanCa = isAddress(rawAddress) && getAddress(rawAddress) !== '0x0000000000000000000000000000000000000000' ? getAddress(rawAddress) : null

  const fetchToken = useCallback(async () => {
    if (!cleanCa) {
      setLoading(false)
      return
    }
    try {
      const data = await getPonsTokenInfo(cleanCa)
      if (data) {
        setToken(data)
      } else {
        // Fallback info query
        const res = await fetch('/api/token-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: cleanCa }),
        })
        if (res.ok) {
          const p = await res.json()
          setToken({
            tokenAddress: cleanCa,
            name: p.name || 'Token',
            symbol: p.symbol || 'TOKEN',
            logo: '/logo.png',
            description: `${p.name} token on Robinhood Chain`,
            socials: { twitter: '', telegram: '', discord: '', website: '', farcaster: '' },
            dexType: 'pons-v2',
            phase: p.phase ?? 0,
            curveAddress: p.curveAddress || cleanCa,
            creatorAddress: p.creatorAddress || '0x0000000000000000000000000000000000000000',
            pairToken: '0x0000000000000000000000000000000000000000',
            poolFee: p.poolFee || 10000,
            tickSpacing: p.tickSpacing || 60,
            creatorTaxBps: p.creatorTaxBps || 100,
            graduationThreshold: '5000000000000000000',
            realQuoteReserve: '0',
            quoteReserve: '0',
            tokenReserve: '1000000000000000000000000000',
            sellableTokens: '800000000000000000000000000',
            readyToGraduate: false,
            graduated: false,
            poolAddress: null,
            poolId: null,
            poolKey: null,
            route: 'BONDING_CURVE',
            isUsdgPaired: false,
            isNative: true,
            priceNative: p.priceNative || 0.0000000025,
            priceUsd: p.priceUsd || 0.00000625,
            progress: 0.0,
          })
        }
      }
    } catch (e) {
      console.error('Error loading token page:', e)
    } finally {
      setLoading(false)
    }
  }, [cleanCa])

  useEffect(() => {
    fetchToken()
    const interval = setInterval(fetchToken, 4000)
    return () => clearInterval(interval)
  }, [fetchToken])

  function copyText(txt: string, label: string) {
    navigator.clipboard.writeText(txt)
    toast.success(`${label} copied!`)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-transparent text-zinc-100 font-mono">
        <Header />
        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!cleanCa || !token) {
    return (
      <div className="flex flex-col min-h-screen bg-transparent text-zinc-100 font-mono">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-none bg-black border-2 border-white flex items-center justify-center text-zinc-400 shadow-[3px_3px_0px_0px_#ffffff]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-white uppercase">// TOKEN NOT FOUND</h1>
          <p className="text-xs text-zinc-400 max-w-md font-sans">
            The token address <code className="text-theme-light font-mono">{rawAddress}</code> was not found on Robinhood Chain.
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-[var(--theme-color)] text-black border-2 border-black font-black text-xs uppercase shadow-[3px_3px_0px_0px_#ffffff] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            WORLD MAP
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const raisedEth = parseFloat(formatEther(BigInt(token.realQuoteReserve || '0')))
  const targetEth = parseFloat(formatEther(BigInt(token.graduationThreshold || '5000000000000000000')))
  const progressPct = (token.progress * 100).toFixed(1)
  const isGraduated = token.phase === 2 || token.graduated
  const marketCapUsd = (token.priceUsd * 1000000000).toLocaleString('en-US', { maximumFractionDigits: 0 })
  const marketCapEth = (token.priceNative * 1000000000).toFixed(3)
  const explorerUrl = `https://robinhoodchain.blockscout.com/token/${token.tokenAddress}`

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-zinc-100 font-mono animate-fadeIn">
      {/* Navigation */}
      <Header />

      {/* Main Terminal Body */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          {/* Breadcrumb & Quick Nav */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-[#A1A1A6] hover:text-[#F5F5F7] transition-colors font-medium bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 rounded-full border border-white/[0.08]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>← Back to World Map</span>
            </Link>

            <span className="flex items-center gap-1.5 text-[#A1A1A6] bg-white/[0.04] border border-white/[0.08] px-3 py-1 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
              Robinhood Chain (4663)
            </span>
          </div>

          {/* Token Header Banner */}
          <div className="apple-glass p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/40 border border-white/[0.12] overflow-hidden relative flex-shrink-0 flex items-center justify-center shadow-md">
                <TokenImage
                  src={token.logo}
                  alt={token.symbol}
                  size={56}
                  sparkleSize={36}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight">
                    {token.name}
                  </h1>
                  <span className="text-xs sm:text-sm font-semibold text-[#0A84FF] bg-[#0A84FF]/10 px-2.5 py-0.5 rounded-full border border-[#0A84FF]/20">
                    ${token.symbol}
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                      isGraduated
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/[0.06] text-[#A1A1A6] border border-white/[0.08]'
                    }`}
                  >
                    {isGraduated ? 'Uniswap V4' : 'Bonding Curve'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#A1A1A6] flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span>CA:</span>
                    <code className="text-[#F5F5F7] font-mono bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-lg">
                      {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
                    </code>
                    <button
                      onClick={() => copyText(token.tokenAddress, 'Token CA')}
                      className="text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer"
                      title="Copy Token CA"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  <span className="text-white/10">/</span>
                  <span>Supply: 1B Fixed</span>
                </div>
              </div>
            </div>

            {/* Social & Explorer Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {token.socials?.twitter && (
                <a
                  href={token.socials.twitter.startsWith('http') ? token.socials.twitter : `https://x.com/${token.socials.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.08] text-xs font-medium transition-all shadow-sm"
                >
                  Twitter
                </a>
              )}
              {token.socials?.telegram && (
                <a
                  href={token.socials.telegram.startsWith('http') ? token.socials.telegram : `https://t.me/${token.socials.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.08] text-xs font-medium transition-all shadow-sm"
                >
                  Telegram
                </a>
              )}
              {token.socials?.website && (
                <a
                  href={token.socials.website.startsWith('http') ? token.socials.website : `https://${token.socials.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.08] text-xs font-medium transition-all shadow-sm"
                >
                  Website
                </a>
              )}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.08] text-xs font-medium transition-all shadow-sm flex items-center gap-1"
              >
                <span>Blockscout</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* Creator Fee Action Button */}
              <button
                onClick={() => setClaimFeesOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#F5F5F7] border border-white/[0.10] text-xs font-medium transition-all active:scale-95 cursor-pointer"
              >
                <span>Creator Royalties</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Market Cap */}
            <div className="apple-glass p-5 flex flex-col gap-1">
              <span className="text-xs text-[#A1A1A6] font-medium">
                Market Cap (FDV)
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight">
                ${marketCapUsd}
              </span>
              <span className="text-xs text-[#6E6E73]">{marketCapEth} ETH</span>
            </div>

            {/* Current Price */}
            <div className="apple-glass p-5 flex flex-col gap-1">
              <span className="text-xs text-[#A1A1A6] font-medium">
                Token Price
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#30D158] truncate tracking-tight">
                ${token.priceUsd < 0.0001 ? token.priceUsd.toFixed(8) : token.priceUsd.toFixed(4)}
              </span>
              <span className="text-xs text-[#6E6E73] truncate font-mono">
                {token.priceNative < 0.00001 ? token.priceNative.toFixed(10) : token.priceNative.toFixed(6)} ETH
              </span>
            </div>

            {/* Graduation Progress */}
            <div className="apple-glass p-5 flex flex-col gap-2 col-span-2 sm:col-span-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#A1A1A6] font-medium">
                  Graduation Progress
                </span>
                <span className="font-semibold text-[#F5F5F7]">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#30D158] transition-all duration-500"
                  style={{
                    width: `${Math.max(3, parseFloat(progressPct))}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-[#6E6E73]">
                {raisedEth.toFixed(3)} / {targetEth.toFixed(1)} ETH Raised
              </span>
            </div>

            {/* Creator Tax */}
            <div className="apple-glass p-5 flex flex-col justify-between gap-1">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs text-[#A1A1A6] font-medium">
                    Creator Tax
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#F5F5F7]">
                    {(token.creatorTaxBps / 100).toFixed(1)}%
                  </span>
                </div>
                <button
                  onClick={() => setClaimFeesOpen(true)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#F5F5F7] border border-white/[0.10] text-[11px] font-medium cursor-pointer"
                >
                  Claim
                </button>
              </div>
              <span className="text-[11px] text-[#6E6E73]">Non-custodial escrow</span>
            </div>
          </div>

          {/* Main 2-Column Split: Chart & Info (Left) + Swap Widget (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Interactive Price Chart & Tabs */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Interactive Price Chart */}
              <TokenPriceChart
                symbol={token.symbol}
                currentPriceUsd={token.priceUsd}
                currentPriceNative={token.priceNative}
                phase={token.phase}
                tokenAddress={token.tokenAddress}
              />

              {/* Overview & Information Box */}
              <div className="apple-glass p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'overview'
                        ? 'bg-[#0A84FF] text-white font-semibold shadow-sm'
                        : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.06]'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('trades')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      activeTab === 'trades'
                        ? 'bg-[#0A84FF] text-white font-semibold shadow-sm'
                        : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.06]'
                    }`}
                  >
                    Contract Details
                  </button>
                </div>

                {activeTab === 'overview' ? (
                  <div className="flex flex-col gap-3 text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
                    <p className="whitespace-pre-wrap text-[#F5F5F7]">
                      {token.description || `${token.name} ($${token.symbol}) is a fair-launched token on Robinhood Chain using the APOLLO Bonding Curve protocol.`}
                    </p>

                    <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5 text-xs text-[#A1A1A6] mt-2">
                      <div className="flex justify-between">
                        <span>Total Fixed Supply:</span>
                        <span className="text-[#F5F5F7] font-semibold">1,000,000,000 ${token.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Curve Liquidity:</span>
                        <span className="text-[#30D158] font-semibold">100% Minted to Curve</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Anti-Sniper Protection:</span>
                        <span className="text-[#F5F5F7]">Decaying Tax Shield</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Graduation DEX:</span>
                        <span className="text-purple-300">Uniswap V4 (Permanently Locked)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                      <span className="text-[#A1A1A6]">Token Address:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[#0A84FF] font-mono">{token.tokenAddress}</code>
                        <button
                          onClick={() => copyText(token.tokenAddress, 'Token Address')}
                          className="text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                      <span className="text-[#A1A1A6]">Curve Contract:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[#F5F5F7] font-mono">{token.curveAddress}</code>
                        <button
                          onClick={() => copyText(token.curveAddress, 'Curve Address')}
                          className="text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                      <span className="text-[#A1A1A6]">Creator Wallet:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[#A1A1A6] font-mono">{token.creatorAddress}</code>
                        <button
                          onClick={() => copyText(token.creatorAddress, 'Creator Wallet')}
                          className="text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Built-in Swap Widget */}
            <div className="lg:col-span-5 sticky top-24">
              <TokenSwapWidget
                token={token}
                onSwapSuccess={() => {
                  fetchToken()
                  refetchBalance()
                }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Claim Creator Fees Modal */}
      <ClaimFeesModal
        open={claimFeesOpen}
        onClose={() => setClaimFeesOpen(false)}
      />
    </div>
  )
}
