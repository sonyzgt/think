'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/Header'
import WorldFlagMap from '@/components/map/WorldFlagMap'
import { PonsV2TokenInfo } from '@/lib/pons-v2'

export default function HomePage() {
  const [tokens, setTokens] = useState<PonsV2TokenInfo[]>([])

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
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 6000)
    return () => clearInterval(interval)
  }, [fetchTokens])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080A0D] text-[#F5F5F5] select-none">
      {/* Dark Floating Top Header */}
      <Header />

      {/* 100% Fullscreen Geographic World Map Canvas (White Map Background) */}
      <main className="flex-1 w-full h-[calc(100vh-57px)] relative overflow-hidden flex flex-col bg-white">
        <WorldFlagMap
          tokens={tokens}
          onTokenRefresh={fetchTokens}
        />
      </main>
    </div>
  )
}
