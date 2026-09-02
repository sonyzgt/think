'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNewChat?: () => void
}

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNewChat,
}: SidebarProps) {
  const pathname = usePathname()
  const { user, login } = usePrivy()
  const { address } = useWallet()

  const [agentOpen, setAgentOpen] = useState(true)
  const [exploreOpen, setExploreOpen] = useState(true)
  const [buildOpen, setBuildOpen] = useState(true)
  const [toolsOpen, setToolsOpen] = useState(true)

  const twitterAccount = user?.linkedAccounts?.find((a) => a.type === 'twitter_oauth') as
    | { username?: string }
    | undefined
  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null
  const displayName = twitterAccount?.username ? `@${twitterAccount.username}` : (shortAddr || 'Guest')

  return (
    <aside
      className={`h-screen flex flex-col bg-[#0b0c0e] border-r border-[#1a1c23] text-zinc-300 font-sans transition-all duration-200 select-none z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1a1c23]/60">
        <Link href="/chat" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(147,51,234,0.4)]">
            <span className="text-white text-base font-black">✦</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-base tracking-tight font-mono">
              Ponscore
            </span>
          )}
        </Link>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 rounded-lg bg-[#14161d] hover:bg-[#1c1f29] border border-[#232734] hover:border-purple-500/50 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group"
        >
          <span className="text-base text-purple-400 font-bold group-hover:scale-110 transition-transform">+</span>
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Nav Categories Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-2 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Category: Agent */}
        <div>
          {!collapsed && (
            <button
              onClick={() => setAgentOpen(!agentOpen)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              <span>Agent</span>
              <svg
                className={`w-3 h-3 transition-transform ${agentOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {agentOpen && (
            <div className="space-y-0.5 mt-1">
              <Link
                href="/chat"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  pathname === '/chat' || pathname === '/'
                    ? 'bg-[#5b21b6] text-white shadow-[0_0_15px_rgba(91,33,182,0.5)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {!collapsed && <span>Chat</span>}
              </Link>

              <Link
                href="/wallet"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  pathname === '/wallet'
                    ? 'bg-[#5b21b6] text-white shadow-[0_0_15px_rgba(91,33,182,0.5)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {!collapsed && <span>Wallet</span>}
              </Link>

              <Link
                href="/coin"
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all ${
                  pathname === '/coin'
                    ? 'bg-[#5b21b6] text-white shadow-[0_0_15px_rgba(91,33,182,0.5)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {!collapsed && <span>Trade</span>}
                </div>
                {!collapsed && (
                  <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-purple-500 text-black rounded font-mono">
                    NEW
                  </span>
                )}
              </Link>

              <Link
                href="/chat"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!collapsed && <span>Automations</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Category: Explore */}
        <div>
          {!collapsed && (
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              <span>Explore</span>
              <svg
                className={`w-3 h-3 transition-transform ${exploreOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {exploreOpen && (
            <div className="space-y-0.5 mt-1">
              <Link
                href="/coin"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {!collapsed && <span>Discover Ponscore tokens</span>}
              </Link>

              <Link
                href="/coin"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {!collapsed && <span>Projects</span>}
              </Link>

              <Link
                href="/coin"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {!collapsed && <span>Metrics</span>}
              </Link>

              <Link
                href="/coin"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {!collapsed && <span>Leaderboard</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Category: Build */}
        <div>
          {!collapsed && (
            <button
              onClick={() => setBuildOpen(!buildOpen)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
            >
              <span>Build</span>
              <svg
                className={`w-3 h-3 transition-transform ${buildOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          {buildOpen && (
            <div className="space-y-0.5 mt-1">
              <Link
                href="/launch"
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all ${
                  pathname === '/launch'
                    ? 'bg-[#5b21b6] text-white shadow-[0_0_15px_rgba(91,33,182,0.5)] font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {!collapsed && <span>Your Tokens</span>}
              </Link>

              <Link
                href="/launch"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {!collapsed && <span>Your Projects</span>}
              </Link>

              <Link
                href="/jembot"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {!collapsed && <span>Apps</span>}
              </Link>

              <Link
                href="/chat"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {!collapsed && <span>Files</span>}
              </Link>
            </div>
          )}
        </div>

        {/* Category: Tools -> Link Telegram */}
        {!collapsed && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Tools</span>
            </div>
            <div className="mt-1 p-3 rounded-xl bg-gradient-to-br from-purple-900/60 via-purple-950/40 to-[#12141c] border border-purple-800/40 flex flex-col gap-1.5 shadow-lg">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <div className="w-5 h-5 rounded-full bg-[#0088cc] flex items-center justify-center text-[10px] text-white">
                  ✈
                </div>
                <span>Link Telegram</span>
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-tight">
                Chat with Ponscore directly from Telegram
              </p>
            </div>
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-[#1a1c23]/60 flex items-center justify-between">
        <button
          onClick={() => {
            if (!user) login()
          }}
          className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity cursor-pointer w-full text-left"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-[11px] text-white font-bold relative">
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border border-[#0b0c0e]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate">{displayName}</span>
              <span className="text-[10px] text-zinc-500">Robinhood Chain</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
