'use client'

import Modal from '@/components/ui/Modal'
import TokenSwapWidget from '@/components/token/TokenSwapWidget'
import { PonsV2TokenInfo } from '@/lib/pons-v2'
import Link from 'next/link'

interface QuickSwapModalProps {
  open: boolean
  token: PonsV2TokenInfo | null
  onClose: () => void
  onSwapSuccess?: () => void
}

export default function QuickSwapModal({
  open,
  token,
  onClose,
  onSwapSuccess,
}: QuickSwapModalProps) {
  if (!token) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Trade $${token.symbol}`}
    >
      <div className="flex flex-col gap-4">
        {/* Token Overview Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{token.logo?.startsWith('http') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.logo} alt={token.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
            ) : '🌍'}</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#F5F5F7]">{token.name}</span>
                <span className="text-xs font-semibold text-[#A1A1A6]">${token.symbol}</span>
              </div>
              <span className="text-[11px] text-[#A1A1A6]">
                Curve Progress: <strong className="text-white font-medium">{token.progress || 0}%</strong>
              </span>
            </div>
          </div>

          <Link
            href={`/token/${token.tokenAddress}`}
            onClick={onClose}
            className="text-xs text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full border border-white/[0.08] transition-all font-medium"
          >
            Full Chart ↗
          </Link>
        </div>

        {/* Swap Widget Component */}
        <TokenSwapWidget
          token={token}
          onSwapSuccess={() => {
            if (onSwapSuccess) onSwapSuccess()
          }}
        />
      </div>
    </Modal>
  )
}
