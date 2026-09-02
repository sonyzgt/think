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
    <header className="sticky top-0 z-30 w-full border-b-2 border-zinc-800 bg-[#08090a]/95 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Universal Sidebar Toggle Button & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Sidebar Toggle Button (ChatGPT style toggle) */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isOpen ? 'Close sidebar' : 'Open sidebar'}
            className="flex items-center justify-center p-2 rounded-md bg-[#12161d] border-2 border-zinc-700 hover:border-white text-zinc-200 hover:text-white cursor-pointer shadow-[2px_2px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Active Section Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-mono text-zinc-500 font-bold tracking-wider">//</span>
            <span className="text-xs sm:text-sm font-black text-white uppercase tracking-tight bg-[#12161d] px-2.5 py-1 rounded border border-zinc-800">
              {getPageTitle()}
            </span>
          </div>
        </div>

        {/* Right Section: Clean Network Status Badge */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 bg-[#12161d] border border-zinc-800 px-2.5 py-1 rounded text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400 font-bold">ROBINHOOD CHAIN</span>
            <span className="text-zinc-500 font-mono">#4663</span>
          </div>
        </div>
      </div>

      {/* Live Token Activity Ticker Bar below Navbar */}
      <LiveTicker />
    </header>
  )
}