'use client'

import { usePathname } from 'next/navigation'
import LiveTicker from './LiveTicker'
import { useSidebar } from '@/context/SidebarContext'

export default function Navbar() {
  const pathname = usePathname()
  const { toggleSidebar, isOpen } = useSidebar()

  // Get Page Title for Breadcrumb
  const getPageTitle = () => {
    if (pathname.startsWith('/coin')) return 'Explore Tokens'
    if (pathname.startsWith('/launch')) return 'Launch Token'
    if (pathname.startsWith('/wallet')) return 'Wallet & Assets'
    if (pathname.startsWith('/chat')) return 'AI Trading Assistant'
    if (pathname.startsWith('/token')) return 'Token Details'
    if (pathname.startsWith('/jembot')) return 'Admin Dashboard'
    return 'Dashboard'
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/[0.08] bg-[#050506]/75 backdrop-blur-2xl select-none">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Universal Sidebar Toggle Button & Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          {/* Sidebar Toggle Button (Apple style) */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isOpen ? 'Close sidebar' : 'Open sidebar'}
            className="flex items-center justify-center p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.10] text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer shadow-sm active:scale-95 transition-all"
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
            <span className="text-xs sm:text-sm font-semibold text-[#F5F5F7] tracking-tight bg-white/[0.06] backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* Right Section: Clean Network Status Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-white/[0.05] backdrop-blur-md border border-white/[0.08] px-3 py-1.5 rounded-full text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_10px_rgba(48,209,88,0.7)] animate-pulse" />
            <span className="text-[#F5F5F7] font-medium">Robinhood Chain</span>
            <span className="text-[#6E6E73] font-mono text-[11px]">#4663</span>
          </div>
        </div>
      </div>

      {/* Live Token Activity Ticker Bar below Navbar */}
      <LiveTicker />
    </header>
  )
}