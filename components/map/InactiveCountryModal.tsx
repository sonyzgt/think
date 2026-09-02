'use client'

import React, { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { CountryData } from '@/lib/countries'
import CreateTokenModal from '@/components/launchpad/CreateTokenModal'
import { useWallet } from '@/hooks/useWallet'
import { usePrivy } from '@privy-io/react-auth'

interface InactiveCountryModalProps {
  country: CountryData | null
  open: boolean
  onClose: () => void
  onLaunchSuccess?: (tokenAddress?: string) => void
}

export default function InactiveCountryModal({
  country,
  open,
  onClose,
  onLaunchSuccess,
}: InactiveCountryModalProps) {
  const { authenticated, login } = usePrivy()
  const { address } = useWallet()
  const [showDeploymentForm, setShowDeploymentForm] = useState(false)

  if (!country) return null

  const isConnected = authenticated && !!address

  return (
    <>
      <Modal
        open={open && !showDeploymentForm}
        onClose={onClose}
        title={`// ${country.code} — UNCLAIMED`}
      >
        <div className="flex flex-col items-center text-center p-4 sm:p-6 gap-5 select-none">
          {/* Country Flag Badge */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-3xl overflow-hidden bg-black/60 border-2 border-white/15 p-1 shadow-2xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={country.flagUrl}
                alt={country.name}
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/20 backdrop-blur-md">
              {country.code}
            </span>
          </div>

          {/* Country Info */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{country.flagEmoji}</span>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">
                {country.name}
              </h2>
            </div>
            <span className="text-xs font-semibold text-zinc-400">
              Ticker: <strong className="text-white font-mono">${country.symbol}</strong> • Region: <strong className="text-zinc-300">{country.region}</strong>
            </span>
          </div>

          {/* Status Message */}
          <div className="w-full p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col gap-1 text-xs">
            <span className="text-zinc-400">Token has not been launched yet.</span>
            <span className="text-white font-medium">
              Be the first to launch and activate the <strong className="text-emerald-400 font-bold">{country.name}</strong> nation token on Robinhood Chain.
            </span>
          </div>

          {/* Primary CTA Button */}
          <div className="w-full flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowDeploymentForm(true)}
              className="w-full py-3 px-5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🚀 LAUNCH {country.symbol} TOKEN</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-full text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Deployment Form Sheet */}
      {showDeploymentForm && (
        <CreateTokenModal
          open={showDeploymentForm}
          onClose={() => {
            setShowDeploymentForm(false)
            onClose()
          }}
          initialName={country.name}
          initialSymbol={country.symbol}
          initialLogo={country.flagUrl}
          initialDescription={country.description}
          onTokenCreated={(tokenAddr) => {
            setShowDeploymentForm(false)
            onClose()
            if (onLaunchSuccess) onLaunchSuccess(tokenAddr)
          }}
        />
      )}
    </>
  )
}
