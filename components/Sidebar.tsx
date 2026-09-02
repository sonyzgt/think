'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import { useTheme } from '@/context/ThemeContext'
import { useSidebar } from '@/context/SidebarContext'
import SparkleIcon from '@/components/ui/SparkleIcon'
import Button from '@/components/ui/Button'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, authenticated, connectWallet, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { address } = useWallet()
  const { theme } = useTheme()
  const { isOpen, closeSidebar } = useSidebar()

  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const isConnected = authenticated && (!!address || !!user)

  const walletAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'wallet'
  ) as { address?: string } | undefined

  const rawAddr = address || user?.wallet?.address || walletAccount?.address
  const shortAddr = rawAddr ? `${rawAddr.slice(0, 6)}...${rawAddr.slice(-4)}` : undefined

  const displayName = shortAddr ?? 'CONNECTED'

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      if (Array.isArray(wallets) && wallets.length > 0) {
        await Promise.allSettled(
          wallets.map((w) => (typeof w.disconnect === 'function' ? w.disconnect() : Promise.resolve()))
        )
      }
      if (typeof logout === 'function') await logout()
    } catch (err) {
      console.warn('Disconnect error:', err)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const navLinks = [
    {
      label: 'World Token Map',
      href: '/',
      code: '01',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'AI Trading Assistant',
      href: '/chat',
      code: '02',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      label: 'Launch Token',
      href: '/launch',
      code: '03',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'Wallet & Assets',
      href: '/wallet',
      code: '04',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Mobile Backdrop Overlay (only on mobile when open) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container (Apple macOS Frosted Glass) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B0B0D]/85 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0 shadow-[24px_0_60px_rgba(0,0,0,0.85)]' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* 1. Header: Logo + Close Sidebar Toggle Button */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center justify-between gap-2">
          <Link
            href="/chat"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) closeSidebar()
            }}
            className="flex items-center gap-2.5 group overflow-hidden"
          >
            <SparkleIcon size={28} className="flex-shrink-0 group-hover:scale-105 transition-transform text-[#0A84FF]" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#F5F5F7]">
                APOLLO
              </span>
              <span className="text-[10px] text-[#A1A1A6] font-medium uppercase tracking-wider">
                Robinhood L2
              </span>
            </div>
          </Link>

          {/* Close Sidebar Button (Apple Style) */}
          <button
            type="button"
            onClick={closeSidebar}
            title="Close sidebar"
            className="flex items-center justify-center p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 2. Quick Action CTA Button */}
        <div className="p-3">
          <Link
            href="/chat"
            onClick={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768) closeSidebar()
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-b from-[#34C759] to-[#28CD41] text-black font-semibold text-xs tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl shadow-[0_4px_18px_rgba(48,209,88,0.4)]"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New AI Session</span>
          </Link>
        </div>

        {/* 3. Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 custom-scrollbar">
          <div className="px-3 py-1 text-[11px] font-semibold text-[#A1A1A6] tracking-wider">
            Navigation
          </div>

          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 768) closeSidebar()
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0A84FF] text-white font-semibold shadow-[0_4px_16px_rgba(10,132,255,0.4),_inset_0_1px_0_rgba(255,255,255,0.3)]'
                    : 'text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex-shrink-0">{link.icon}</div>
                <div className="flex items-center justify-between flex-1 overflow-hidden">
                  <span className="truncate">{link.label}</span>
                </div>
              </Link>
            )
          })}

          {/* On-Chain Status */}
          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col gap-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-[#A1A1A6] tracking-wider">
              Network
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.7)] animate-pulse" />
                <span className="font-medium text-[#F5F5F7]">Robinhood Chain</span>
              </div>
              <span className="text-[11px] text-[#A1A1A6] font-mono">#4663</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Footer Section (User Profile + Connect) */}
        <div className="p-3 border-t border-white/[0.08] bg-[#070709]/80 backdrop-blur-xl flex flex-col gap-2">

          {/* User Account / Connect Section */}
          {isConnected ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                <div
                  className="w-7 h-7 rounded-full text-black font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: theme.color }}
                >
                  {displayName[1]?.toUpperCase() || displayName[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="text-xs font-semibold text-white truncate">{displayName}</span>
                  {shortAddr && <span className="text-[10px] text-zinc-400 font-mono truncate">{shortAddr}</span>}
                </div>
              </div>

              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium rounded-xl transition-all cursor-pointer active:scale-98"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={login}
              className="w-full text-xs font-semibold py-2.5 rounded-xl bg-[#FF6A00] hover:bg-[#FF7A00] text-white"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </aside>
    </>
  )
}
