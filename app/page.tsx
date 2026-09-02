'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WorldFlagMap from '@/components/map/WorldFlagMap'
import { PonsV2TokenInfo } from '@/lib/pons-v2'

export default function HomePage() {
  const [tokens, setTokens] = useState<PonsV2TokenInfo[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch real on-chain tokens
  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/launchpad/tokens')
      if (res.ok) {
        const data = await res.json()
        if (data.tokens && Array.isArray(data.tokens)) {
          setTokens(data.tokens)
        }
      }
    } catch (err) {
      console.error('Failed to fetch tokens for world map:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 6000)
    return () => clearInterval(interval)
  }, [fetchTokens])

  return (
    <div className="flex flex-col min-h-screen bg-[#050506] text-[#F5F5F7] animate-fadeIn select-none">
      {/* Minimal Header */}
      <Header />

      {/* Main World Map Hero */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 py-5 sm:py-8 flex flex-col gap-6">
        {/* Main Minimal Title */}
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            The World of Tokens
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Every country. One token ecosystem.
          </p>
        </div>

        {/* 100% Primary World Map Interface */}
        <div className="w-full">
          <WorldFlagMap
            tokens={tokens}
            onTokenRefresh={fetchTokens}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
