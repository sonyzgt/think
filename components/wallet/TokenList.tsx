'use client'

import { useState } from 'react'
import { useTokens } from '@/hooks/useTokens'
import { activeChain } from '@/lib/chains'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import SparkleIcon from '@/components/ui/SparkleIcon'

interface TokenListProps {
  onQuickSwap: (tokenAddress: string) => void
}

export default function TokenList({ onQuickSwap }: TokenListProps) {
  const { holdings, importToken, removeToken } = useTokens()
  const [importOpen, setImportOpen] = useState(false)
  const [caInput, setCaInput] = useState('')

  async function copyAddress(addr: string) {
    await navigator.clipboard.writeText(addr)
    toast.success('Token address copied!')
  }

  function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!caInput.trim()) return
    importToken(caInput.trim())
    setCaInput('')
    setImportOpen(false)
  }

  const totalTokensValueUsd = holdings.reduce((sum, h) => sum + (h.valueUsd || 0), 0)

  return (
    <div className="flex flex-col apple-glass overflow-hidden w-full h-[400px] sm:h-[480px] flex-shrink-0 select-none">
      {/* Box Header */}
      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-white/[0.03] flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#F5F5F7] flex items-center gap-2">
              <span>Holdings</span>
              <span className="text-xs font-normal text-[#A1A1A6]">
                ({holdings.length} tokens)
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#A1A1A6]">
            Estimated Value:{' '}
            <span className="font-semibold text-[#F5F5F7]">
              ${totalTokensValueUsd.toFixed(2)} USD
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setImportOpen(true)}
            className="text-xs font-semibold py-1.5 px-4 rounded-full"
          >
            + Import Token
          </Button>
        </div>
      </div>

      {/* Box Body - Scrollable Viewport */}
      <div className="flex-1 min-h-0 p-4 sm:p-5 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[220px] p-6 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
              <SparkleIcon size={24} className="text-[#0A84FF]" />
            </div>
            <p className="text-sm font-semibold text-[#F5F5F7]">No Holdings Found</p>
            <p className="text-xs text-[#A1A1A6] max-w-sm">
              Tokens with balance on Robinhood Chain automatically appear here.
            </p>
            <Button size="sm" variant="secondary" onClick={() => setImportOpen(true)} className="mt-2 text-xs py-2 px-4 rounded-full">
              + Import Custom Token
            </Button>
          </div>
        ) : (
          holdings.map((h) => {
            const hasBalance = h.balanceNumber > 0
            const explorerUrl = `${activeChain.blockExplorers.default.url}/token/${h.address}`

            return (
              <div
                key={h.address}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl apple-card-interactive"
              >
                {/* Left: Token Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
                    <SparkleIcon size={22} className="text-[#0A84FF]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#F5F5F7]">${h.symbol}</span>
                      {hasBalance && (
                        <span className="text-[10px] font-medium bg-[#30D158]/15 text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/30">
                          Held
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#A1A1A6] truncate max-w-[140px]">{h.name}</span>
                      <span className="text-white/10">/</span>
                      <button
                        onClick={() => copyAddress(h.address)}
                        className="text-[11px] font-mono text-[#6E6E73] hover:text-[#F5F5F7] transition-colors flex items-center gap-0.5 cursor-pointer"
                        title="Copy Contract Address"
                      >
                        <span>{h.address.slice(0, 4)}...{h.address.slice(-4)}</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Balance & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.06]">
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-[#F5F5F7]">
                      {h.balanceFormatted} <span className="text-xs font-normal text-[#0A84FF]">${h.symbol}</span>
                    </p>
                    <p className="text-xs text-[#A1A1A6] mt-0.5">
                      {h.usdPrice > 0 ? (
                        <>
                          <span className="font-medium text-[#F5F5F7]">
                            ${h.valueUsd < 0.01 && h.valueUsd > 0 ? h.valueUsd.toFixed(4) : h.valueUsd.toFixed(2)}
                          </span>
                          <span className="text-[#6E6E73] ml-1">
                            (@${h.usdPrice < 0.01 ? h.usdPrice.toFixed(6) : h.usdPrice.toFixed(2)})
                          </span>
                        </>
                      ) : (
                        <span className="text-[#6E6E73]">Syncing price...</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onQuickSwap(h.address)}
                      className="px-3.5 py-1 rounded-full bg-[#0A84FF] hover:bg-[#2492FF] text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
                      title={`Swap ${h.symbol}`}
                    >
                      Swap
                    </button>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#A1A1A6] hover:text-[#F5F5F7] border border-white/[0.08] transition-all"
                      title="View on Explorer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    {h.symbol !== 'CHEF' && (
                      <button
                        onClick={() => removeToken(h.address)}
                        className="p-1.5 rounded-full bg-white/[0.06] hover:bg-rose-500/20 text-[#A1A1A6] hover:text-rose-300 border border-white/[0.08] transition-all cursor-pointer"
                        title="Remove from watch list"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal: Import Custom Token */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Custom Token">
        <form onSubmit={handleImportSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-[#A1A1A6] leading-relaxed">
            Enter the token contract address on Robinhood Chain to track balances and enable instant buy/sell swaps.
          </p>

          <div>
            <label className="text-xs font-medium text-[#A1A1A6] mb-1.5 block">
              Contract Address (0x...)
            </label>
            <input
              type="text"
              required
              value={caInput}
              onChange={(e) => setCaInput(e.target.value)}
              placeholder="0x..."
              className="w-full apple-input px-3.5 py-2.5 text-xs font-mono text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={() => setImportOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="rounded-full">
              Import Token
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
