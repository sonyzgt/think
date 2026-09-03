export interface SwapEventPayload {
  id?: string
  fromCountry?: string // Country code e.g. 'BR'
  toCountry: string // Country code e.g. 'RU'
  fromCountryName?: string
  toCountryName?: string
  fromFlagUrl?: string
  toFlagUrl?: string
  amount: string
  tokenSymbol: string
  type: 'BUY' | 'SELL' | 'SWAP'
  timestamp?: number
  txHash?: string
}

const SWAP_EVENT_KEY = 'apollo_token_swap'
const STORAGE_KEY = 'apollo_swap_history_v1'

// Initial real-time transaction history store
let inMemorySwapLogs: SwapEventPayload[] = []

export function recordSwapEvent(payload: SwapEventPayload) {
  const item: SwapEventPayload = {
    ...payload,
    id: payload.id || `swap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: payload.timestamp || Date.now(),
    fromCountry: (payload.fromCountry || 'US').toUpperCase(),
    toCountry: payload.toCountry.toUpperCase(),
  }

  inMemorySwapLogs = [item, ...inMemorySwapLogs].slice(0, 50)

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemorySwapLogs))
    } catch { /* ignore */ }

    window.dispatchEvent(
      new CustomEvent(SWAP_EVENT_KEY, {
        detail: item,
      })
    )
  }

  return item
}

export function getRecentSwapLogs(): SwapEventPayload[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemorySwapLogs = parsed
        }
      }
    } catch { /* ignore */ }
  }
  return inMemorySwapLogs
}
