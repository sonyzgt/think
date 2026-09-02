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

  return (
    <>
      <Modal
        open={open && !showDeploymentForm}
        onClose={onClose}
        title={`// ${country.code} — UNCLAIMED NATION`}
      >
        <div className="flex flex-col items-center text-center p-4 sm:p-6 gap-5 select-none font-mono">
          {/* Physical Embossed Country Flag Medallion */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl skeuo-panel p-1.5 shadow-2xl flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={country.flagUrl}
                alt={country.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold skeuo-button text-white shadow-md">
              {country.code}
            </span>
          </div>

          {/* Country Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{country.flagEmoji}</span>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {country.name}
              </h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              TICKER: <strong className="text-emerald-400">${country.symbol}</strong> • REGION: <strong className="text-zinc-200">{country.region}</strong>
            </span>
          </div>

          {/* Status Message (Debossed Screen) */}
          <div className="w-full p-4 rounded-xl skeuo-inset flex flex-col gap-1.5 text-xs text-left">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full skeuo-led-off flex-shrink-0" />
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                STATUS: NOT LAUNCHED
              </span>
            </div>
            <span className="text-zinc-200 font-sans leading-relaxed text-[11px]">
              Be the first to launch and activate the <strong className="text-emerald-400 font-bold">{country.name}</strong> nation token on Robinhood Chain.
            </span>
          </div>

          {/* Primary CTA 3D Buttons */}
          <div className="w-full flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowDeploymentForm(true)}
              className="w-full py-3.5 px-5 rounded-xl skeuo-button-primary text-xs font-black uppercase tracking-wider cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <span>🚀 LAUNCH {country.symbol} TOKEN</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl skeuo-button text-xs font-mono font-bold text-zinc-400 hover:text-white cursor-pointer"
            >
              CANCEL
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
          initialDescription={country.description}
          initialLogo={country.flagUrl}
          onTokenCreated={(tokenAddress) => {
            setShowDeploymentForm(false)
            onClose()
            if (onLaunchSuccess) {
              onLaunchSuccess(tokenAddress)
            }
          }}
        />
      )}
    </>
  )
}
