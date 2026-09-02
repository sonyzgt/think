'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy, useLoginWithOAuth, useWallets } from '@privy-io/react-auth'
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
  const { theme, setThemeId, themes } = useTheme()
  const { isOpen, closeSidebar } = useSidebar()

  const [loggingIn, setLoggingIn] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [loginMenuOpen, setLoginMenuOpen] = useState(false)

  const isConnected = authenticated && (!!address || !!user)

  const twitterAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth'
  ) as { username?: string } | undefined

  const googleAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'google_oauth'
  ) as { name?: string; email?: string } | undefined

  const walletAccount = user?.linkedAccounts?.find(
    (a) => a.type === 'wallet'
  ) as { address?: string } | undefined

  const rawAddr = address || user?.wallet?.address || walletAccount?.address
  const shortAddr = rawAddr ? `${rawAddr.slice(0, 6)}...${rawAddr.slice(-4)}` : undefined

  const displayName = twitterAccount?.username
    ? `@${twitterAccount.username}`
    : googleAccount?.name ?? googleAccount?.email?.split('@')[0] ?? user?.email?.address?.split('@')[0] ?? shortAddr ?? 'CONNECTED'

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => {
      setLoggingIn(false)
      setLoginMenuOpen(false)
    },
    onError: (err) => {
      console.error('Login error:', err)
      setLoggingIn(false)
      if (typeof login === 'function') login()
    },
  })

  const handleOAuth = async (provider: 'twitter' | 'google') => {
    try {
      setLoggingIn(true)
      setLoginMenuOpen(false)
      if (typeof initOAuth === 'function') {
        await initOAuth({ provider })
      } else if (typeof login === 'function') {
        login()
      }
    } catch {
      setLoggingIn(false)
      if (typeof login === 'function') login()
    }
  }

  const handleWalletLogin = () => {
    setLoginMenuOpen(false)
    try {
      if (typeof login === 'function') {
        login()
      } else {
        connectWallet()
      }
    } catch {
      connectWallet()
    }
  }

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
      label: 'AI AGENT CHAT',
      href: '/chat',
      code: '01',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      label: 'COINS EXPLORER',
      href: '/coin',
      code: '02',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: 'LAUNCH TOKEN',
      href: '/launch',
      code: '03',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      label: 'WALLET & HOLDINGS',
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c0c0e]/85 backdrop-blur-3xl border-r border-white/[0.08] flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full pointer-events-none'
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
            <SparkleIcon size={28} className="flex-shrink-0 group-hover:scale-105 transition-transform text-[var(--theme-color)]" />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                PONSCORE
              </span>
              <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                Robinhood L2
              </span>
            </div>
          </Link>

          {/* Close Sidebar Button (Apple Style) */}
          <button
            type="button"
            onClick={closeSidebar}
            title="Close sidebar"
            className="flex items-center justify-center p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-zinc-400 hover:text-white cursor-pointer transition-all active:scale-95 shadow-sm"
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
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-b from-[#34c759] to-[#28cd41] text-black font-bold text-xs tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl shadow-[0_4px_18px_rgba(48,209,88,0.45)]"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New AI Chat</span>
          </Link>
        </div>

        {/* 3. Navigation Links List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1 custom-scrollbar">
          <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 tracking-wider">
            Menu
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#34c759] to-[#28cd41] text-black font-bold shadow-[0_4px_16px_rgba(48,209,88,0.35)]'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
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
            <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 tracking-wider">
              Network
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
                <span className="font-medium text-zinc-200">Robinhood L2</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">#4663</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Footer Section (User Profile + Theme Palette + Connect) */}
        <div className="p-3 border-t border-white/[0.08] bg-[#070709]/80 backdrop-blur-xl flex flex-col gap-2">
          {/* Theme Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] hover:border-white/[0.2] px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <span className="text-xs font-medium">{theme.name}</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">Theme ▾</span>
            </button>

            {/* Theme Selector Popover */}
            {themeMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} />
                <div
                  className="absolute bottom-full left-0 mb-2 w-52 bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/[0.15] rounded-2xl p-2 z-50 flex flex-col gap-1 shadow-2xl animate-fadeIn"
                >
                  <div className="px-2 py-1 flex items-center justify-between border-b border-white/[0.08] mb-1">
                    <span className="text-[11px] font-semibold text-zinc-400">Accent Colors</span>
                    <span className="text-[10px] text-zinc-500 font-mono">[{themes.length}]</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {themes.map((t) => {
                      const isSelected = t.id === theme.id
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setThemeId(t.id)
                            setThemeMenuOpen(false)
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[var(--theme-color)] text-black border border-white'
                              : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 border border-black shadow-[1px_1px_0px_0px_#ffffff] flex-shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            <span>{t.name}</span>
                          </div>
                          {isSelected && <span className="text-[10px] font-black font-mono">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

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
            <div className="relative">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLoginMenuOpen((prev) => !prev)}
                loading={loggingIn}
                className="w-full text-xs font-semibold py-2.5 rounded-xl"
              >
                Connect Wallet
              </Button>

              {loginMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLoginMenuOpen(false)} />
                  <div
                    className="absolute bottom-full left-0 mb-2 w-56 bg-[#1c1c1e]/90 backdrop-blur-2xl border border-white/[0.15] rounded-2xl p-2.5 z-50 flex flex-col gap-1.5 shadow-2xl animate-fadeIn"
                  >
                    <div className="px-2 py-1 border-b border-white/[0.08] mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-400">Sign In</span>
                      <span className="text-[10px] text-emerald-400 font-medium">Robinhood L2</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOAuth('twitter')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white text-zinc-200 hover:text-black font-medium text-xs transition-all border border-white/[0.08] cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      <span>Twitter (X)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white text-zinc-200 hover:text-black font-medium text-xs transition-all border border-white/[0.08] cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Google</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWalletLogin}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white text-zinc-200 hover:text-black font-medium text-xs transition-all border border-white/[0.08] cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Web3 Wallet</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
