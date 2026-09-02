import { NextRequest, NextResponse } from 'next/server'
import {
  getPonsTokenInfo,
  PonsV2TokenInfo,
} from '@/lib/pons-v2'
import { isAddress, getAddress } from 'viem'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const REGISTRY_FILE = path.join(process.cwd(), 'data', 'launched_tokens.json')

export interface StoredTokenEntry {
  tokenAddress: string
  curveAddress?: string
  name?: string
  symbol?: string
  countryCode?: string
  createdAt?: number
  initialMcapUsd?: number
  lastMcapUsd?: number
  swapCount?: number
}

async function getStoredEntries(): Promise<StoredTokenEntry[]> {
  try {
    const raw = await readFile(REGISTRY_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      const results: StoredTokenEntry[] = []
      for (const item of parsed) {
        if (typeof item === 'string' && isAddress(item)) {
          results.push({
            tokenAddress: getAddress(item),
            createdAt: Date.now(),
          })
        } else if (item && typeof item === 'object') {
          const addr = item.tokenAddress || item.address
          if (addr && isAddress(addr)) {
            results.push({
              tokenAddress: getAddress(addr),
              curveAddress: item.curveAddress ? getAddress(item.curveAddress) : undefined,
              name: item.name,
              symbol: item.symbol,
              countryCode: item.countryCode,
              createdAt: item.createdAt || Date.now(),
              initialMcapUsd: item.initialMcapUsd || 0,
              lastMcapUsd: item.lastMcapUsd || 0,
              swapCount: item.swapCount || 0,
            })
          }
        }
      }
      return results
    }
  } catch {
    try {
      await mkdir(path.dirname(REGISTRY_FILE), { recursive: true })
      await writeFile(REGISTRY_FILE, JSON.stringify([], null, 2))
    } catch { /* ignore */ }
  }
  return []
}

async function saveStoredEntries(entries: StoredTokenEntry[]) {
  try {
    await mkdir(path.dirname(REGISTRY_FILE), { recursive: true })
    await writeFile(REGISTRY_FILE, JSON.stringify(entries, null, 2))
  } catch (e) {
    console.error('Error saving platform tokens registry:', e)
  }
}

const CACHE_FILE = path.join(process.cwd(), 'data', 'tokens_cache.json')

interface GlobalTokensCache {
  data: PonsV2TokenInfo[]
  lastFetch: number
  isFetching: boolean
}

const g = globalThis as unknown as { __tokensCache?: GlobalTokensCache }
if (!g.__tokensCache) {
  g.__tokensCache = {
    data: [],
    lastFetch: 0,
    isFetching: false,
  }
}

const TEN_MINUTES_MS = 10 * 60 * 1000 // 10 minutes in milliseconds

async function refreshTokensInBackground() {
  if (g.__tokensCache?.isFetching) return
  if (g.__tokensCache) g.__tokensCache.isFetching = true

  try {
    const storedEntries = await getStoredEntries()
    const validEntries: StoredTokenEntry[] = []
    const tokenInfos: PonsV2TokenInfo[] = []
    const now = Date.now()

    for (const entry of storedEntries) {
      try {
        const info = await getPonsTokenInfo(entry.tokenAddress)
        if (!info) continue

        const createdAt = entry.createdAt || now
        const expiresAt = createdAt + TEN_MINUTES_MS
        const age = now - createdAt

        // Check if there was any buy activity on the bonding curve
        const progress = info.progress || 0
        const hasQuoteReserve = info.realQuoteReserve && info.realQuoteReserve !== '0'
        const hasTrades = progress > 0 || hasQuoteReserve || info.graduated

        // If 10 minutes have elapsed and ZERO buys occurred, AUTO-RESET this nation token
        if (age > TEN_MINUTES_MS && !hasTrades) {
          console.log(`[Inactivity Reset] Token ${info.symbol} (${entry.tokenAddress}) had 0 buys in 10 minutes. Resetting country slot.`)
          // Do not include in validEntries -> Automatically purged from registry
          continue
        }

        // Attach timing metadata to token info
        const enrichedInfo: PonsV2TokenInfo = {
          ...info,
          createdAt,
          expiresAt: hasTrades ? undefined : expiresAt,
        }

        tokenInfos.push(enrichedInfo)
        validEntries.push({
          ...entry,
          createdAt,
          lastMcapUsd: (info.priceUsd || (info.priceNative * 2500) || 0) * 1000000000,
        })
      } catch (e) {
        console.error(`Error resolving token ${entry.tokenAddress}:`, e)
      }
    }

    // If any stagnant token was purged, update the registry file
    if (validEntries.length !== storedEntries.length) {
      await saveStoredEntries(validEntries)
    }

    // Always update in-memory and disk cache
    if (g.__tokensCache) {
      g.__tokensCache.data = tokenInfos
      g.__tokensCache.lastFetch = Date.now()
    }
    try {
      await writeFile(CACHE_FILE, JSON.stringify(tokenInfos, null, 2))
    } catch { /* ignore */ }
  } catch (err) {
    console.error('Background refresh error:', err)
  } finally {
    if (g.__tokensCache) g.__tokensCache.isFetching = false
  }
}

// Initial disk cache load on startup
async function getCachedTokens(): Promise<PonsV2TokenInfo[]> {
  if (g.__tokensCache && g.__tokensCache.data.length > 0) {
    return g.__tokensCache.data
  }
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (g.__tokensCache) {
        g.__tokensCache.data = parsed
        g.__tokensCache.lastFetch = Date.now()
      }
      return parsed
    }
  } catch { /* ignore */ }
  return []
}

export async function GET() {
  try {
    const now = Date.now()
    const cached = await getCachedTokens()

    // If cache is present, return IMMEDIATELY (< 5ms) and revalidate in background if > 2s old
    if (cached.length > 0) {
      if (now - (g.__tokensCache?.lastFetch || 0) > 2000) {
        refreshTokensInBackground().catch(() => {})
      }
      return NextResponse.json({
        success: true,
        tokens: cached,
        count: cached.length,
        cached: true,
      })
    }

    // First ever run with no disk cache: fetch synchronously
    await refreshTokensInBackground()
    const fresh = g.__tokensCache?.data || []

    return NextResponse.json({
      success: true,
      tokens: fresh,
      count: fresh.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch tokens'
    return NextResponse.json({ success: false, error: msg, tokens: [] }, { status: 500 })
  }
}

// POST endpoint to register newly deployed tokens instantly on this platform
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawAddress = String(body.address || body.tokenAddress || '').trim()

    if (!rawAddress || !isAddress(rawAddress)) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 })
    }

    const clean = getAddress(rawAddress)
    const stored = await getStoredEntries()

    if (!stored.some((s) => s.tokenAddress.toLowerCase() === clean.toLowerCase())) {
      stored.unshift({
        tokenAddress: clean,
        curveAddress: body.curveAddress ? getAddress(body.curveAddress) : undefined,
        name: body.name,
        symbol: body.symbol,
        countryCode: body.countryCode,
        createdAt: Date.now(),
      })
      await saveStoredEntries(stored)
    }

    // Invalidate cache immediately so new token appears instantly
    if (g.__tokensCache) {
      g.__tokensCache.lastFetch = 0
    }
    await refreshTokensInBackground()

    const info = await getPonsTokenInfo(clean)

    return NextResponse.json({
      success: true,
      registered: clean,
      token: info,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to register token'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
