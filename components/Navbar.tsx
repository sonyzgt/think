'use client'

import { usePathname } from 'next/navigation'
import LiveTicker from './LiveTicker'
import { useSidebar } from '@/context/SidebarContext'

export default function Navbar() {
  const pathname = usePathname()
  const { toggleSidebar, isOpen } = useSidebar()

  // Get Page Title for Breadcrumb
  const getPageTitle = () => {
    if (pathname.startsWith('/coin')) return 'COINS EXPLORER'
    if (pathname.startsWith('/launch')) return 'LAUNCH TOKEN'
    if (pathname.startsWith('/wallet')) return 'WALLET & HOLDINGS'
    if (pathname.startsWith('/chat')) return 'AI AGENT CHAT'
    if (pathname.startsWith('/token')) return 'TOKEN DETAILS'
    if (pathname.startsWith('/jembot')) return 'ADMIN DASHBOARD'
    return 'DASHBOARD'
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#000000]/60 backdrop-blur-2xl select-none">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Universal Sidebar Toggle Button & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Sidebar Toggle Button (Apple style) */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isOpen ? 'Close sidebar' : 'Open sidebar'}
            className="flex items-center justify-center p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-zinc-300 hover:text-white cursor-pointer shadow-sm active:scale-95 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Active Section Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-zinc-200 uppercase tracking-tight bg-white/[0.06] backdrop-blur-md px-3 py-1 rounded-xl border border-white/[0.08]">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* Right Section: Clean Network Status Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] px-3 py-1 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
            <span className="text-zinc-300 font-medium">Robinhood Chain</span>
            <span className="text-zinc-500 font-mono text-[11px]">#4663</span>
          </div>
        </div>
      </div>

      {/* Live Token Activity Ticker Bar below Navbar */}
      <LiveTicker />
    </header>
  )
}