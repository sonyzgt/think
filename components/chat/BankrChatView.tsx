'use client'

import React, { useState, useRef, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import Spinner from '@/components/ui/Spinner'
import CreateTokenModal from '@/components/launchpad/CreateTokenModal'
import { getPonsTokenInfo, PonsV2TokenInfo } from '@/lib/pons-v2'
import { ChatMessage, parseTradingCommandDeterministic } from '@/lib/chat-agent'
import Link from 'next/link'

interface BankrChatViewProps {
  onNewChatRef?: React.MutableRefObject<(() => void) | null>
}

export default function BankrChatView({ onNewChatRef }: BankrChatViewProps) {
  const { user, login } = usePrivy()
  const { address } = useWallet()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [maxMode, setMaxMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'explore' | 'build'>('chat')
  const [isExecuting, setIsExecuting] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [statusStep, setStatusStep] = useState<string | null>(null)

  // Launch modal state
  const [launchModalOpen, setLaunchModalOpen] = useState(false)
  const [launchModalData, setLaunchModalData] = useState({ name: '', symbol: '' })

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Reset chat function
  const handleResetChat = () => {
    setMessages([])
    setInput('')
    setTxHash(null)
    setStatusStep(null)
  }

  if (onNewChatRef) {
    onNewChatRef.current = handleResetChat
  }

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loadingAi])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text || loadingAi) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoadingAi(true)

    try {
      const parsed = parseTradingCommandDeterministic(text)

      // Fetch AI Route response
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userAddress: address,
          userTwitter: user?.twitter?.username,
        }),
      })

      const json = await res.json().catch(() => ({}))

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: json.reply || `Executing command on Robinhood Chain: ${text}`,
        timestamp: Date.now(),
        action: json.action || parsed,
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `I've analyzed your request on Robinhood Chain.`,
        timestamp: Date.now(),
        action: parseTradingCommandDeterministic(text),
      }
      setMessages((prev) => [...prev, fallbackMsg])
    } finally {
      setLoadingAi(false)
    }
  }

  const handleExecuteTrade = async (action: ChatMessage['action']) => {
    if (!action || !action.tokenAddress) return
    setIsExecuting(true)
    setStatusStep('Broadcasting transaction to Robinhood Chain...')
    setTxHash(null)

    try {
      const isBuy = action.intent === 'BUY'
      const swapRes = await fetch('/api/launchpad/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          twitterHandle: user?.twitter?.username,
          tokenAddress: action.tokenAddress,
          isBuy,
          amount: action.amount || '0.001',
          percentage: action.percentage,
        }),
      })

      const swapData = await swapRes.json()
      if (swapData.success && swapData.txHash) {
        setTxHash(swapData.txHash)
        setStatusStep(`Trade successfully executed!`)
      } else {
        setStatusStep(`Swap failed: ${swapData.error || 'Execution reverted'}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Swap error'
      setStatusStep(`Error: ${msg}`)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#08090b] text-zinc-100 font-sans">
      {/* Top Header Bar */}
      <header className="h-14 px-6 border-b border-[#181a22] flex items-center justify-between flex-shrink-0 bg-[#08090b]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg bg-[#14161f] border border-[#232634] hover:border-purple-500/40 text-zinc-400 hover:text-white transition-all cursor-pointer"
            title="Reset Conversation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <span className="font-semibold text-sm text-white tracking-tight">Chat</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-[#12141c] border border-zinc-800 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Robinhood Chain (ID: 4663)</span>
          </span>

          {!user && (
            <button
              onClick={() => login()}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-semibold text-xs transition-all cursor-pointer shadow-[0_0_15px_rgba(124,58,237,0.4)]"
            >
              Connect
            </button>
          )}
        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-5">
        {/* 1. Hero Gradient Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-purple-900/60 via-indigo-950/50 to-[#12141c] border border-purple-800/40 p-5 flex items-center justify-between overflow-hidden shadow-xl group cursor-pointer hover:border-purple-600/60 transition-all">
          <div className="flex items-center gap-4 z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] flex-shrink-0">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Explore the agent economy
              </h2>
              <span className="text-xs text-purple-300/80">
                Autonomous DeFi agent on Robinhood Chain — trade, snipe, deploy, automate.
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-zinc-300 group-hover:bg-purple-600 group-hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* 2. Tip Bar */}
        <div className="flex items-center justify-between bg-[#0e1017] border border-[#1c1f2b] rounded-xl px-4 py-2.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-purple-950/80 text-purple-400 border border-purple-800/50 px-2 py-0.5 rounded-md font-bold text-[11px]">
              Tip
            </span>
            <span className="text-zinc-400 truncate">
              Save research to your files. Try:{' '}
              <button
                onClick={() => handleSendMessage('Research $PONSCORE and execute swap')}
                className="text-white hover:underline font-medium cursor-pointer"
              >
                Research $PONSCORE and execute swap...
              </button>
            </span>
          </div>

          <button
            onClick={() => handleSendMessage('Give me top trading tips on Robinhood Chain')}
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer p-1"
            title="Refresh tip"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* 3. Model Guide Card */}
        <div className="bg-[#0e1017] border border-[#1c1f2b] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1 max-w-xl">
            <h3 className="text-xs font-bold text-white">Which model should I use?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              You&apos;re in <span className="text-purple-400 font-semibold">Fast Mode</span>, which prioritizes speed. For complex tasks like token launches, sniper swaps, and smart contract routing, Max Mode gives higher accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMaxMode(true)}
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              Use Max Mode
            </button>
            <button
              className="px-3.5 py-1.5 rounded-lg bg-[#181a24] hover:bg-[#222533] border border-zinc-800 text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>

        {/* 4. Main Prominent Prompt Box (The Core Centerpiece) */}
        <div className="bg-[#0e1017] border-2 border-[#222533] focus-within:border-purple-600/70 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl transition-all">
          {/* Header of prompt box */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                Free mode
                <span className="text-zinc-500 cursor-pointer text-[10px]">ⓘ</span>
              </span>
              <span className="bg-[#181a24] border border-zinc-800 text-purple-300 text-[11px] px-2.5 py-0.5 rounded-full font-mono font-medium">
                0/5 free messages
              </span>
            </div>

            <button
              onClick={() => handleSendMessage('Explain Ponscore Club Benefits')}
              className="px-3 py-1 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-xs transition-all cursor-pointer shadow-[0_0_10px_rgba(147,51,234,0.3)]"
            >
              Join Club
            </button>
          </div>

          {/* Text Input Area */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Ask anything... (e.g. buy 0.01 eth $PONSCORE, sell all $TEST, deploy token $NAME)"
            rows={3}
            className="w-full bg-transparent border-0 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none font-sans"
          />

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1c1f2b]/80 flex-wrap gap-2">
            <div className="flex items-center gap-2.5 text-xs text-zinc-400 flex-wrap">
              {/* Attachment Icon */}
              <button
                onClick={() => setLaunchModalOpen(true)}
                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Attach file / Launch Token"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Max Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-[#14161f] border border-zinc-800 px-2.5 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMaxMode(!maxMode)}
                  className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                    maxMode ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                      maxMode ? 'left-3.5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-[11px] font-semibold text-zinc-300">Max Mode</span>
                <span className="text-zinc-500 text-[10px] cursor-pointer">ⓘ</span>
              </div>

              {/* Model Pill */}
              <div className="bg-[#14161f] border border-zinc-800 px-2 py-1 rounded-lg text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <span>{maxMode ? 'Max 3.0' : 'Fast'}</span>
                <span className="text-zinc-500 text-[9px]">∨</span>
              </div>

              {/* Credits */}
              <span className="bg-[#14161f] border border-zinc-800 px-2 py-1 rounded-lg text-[11px] text-purple-300 font-mono font-bold">
                $0.00 credits
              </span>

              {/* Gas Free */}
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                0/10 Gas free txs <span className="text-zinc-600">ⓘ</span>
              </span>
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || loadingAi}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                input.trim() && !loadingAi
                  ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.5)]'
                  : 'bg-[#181a24] text-zinc-600 cursor-not-allowed'
              }`}
            >
              {loadingAi ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 5. Messages Stream & Action Cards (If conversation started) */}
        {messages.length > 0 && (
          <div className="flex flex-col gap-4 py-2">
            {messages.map((msg) => {
              const isUser = msg.role === 'user'
              const isAction = !!msg.action && msg.action.intent !== 'GENERAL'

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 font-bold text-xs shadow-md">
                      ✦
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-xl p-4 flex flex-col gap-2 ${
                      isUser
                        ? 'bg-purple-600/90 text-white font-medium shadow-md'
                        : 'bg-[#0e1017] border border-[#1c1f2b] text-zinc-200'
                    }`}
                  >
                    <p className="whitespace-pre-line font-sans">{msg.content}</p>

                    {/* Interactive Action Card if Buy / Sell */}
                    {isAction && (msg.action?.intent === 'BUY' || msg.action?.intent === 'SELL') && (
                      <div className="mt-2 bg-[#12141c] border border-purple-500/40 rounded-lg p-3 flex flex-col gap-2.5">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                          <span className="text-[10px] font-black uppercase text-purple-400">
                            // ORDER_PREVIEW
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              msg.action.intent === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {msg.action.intent}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-zinc-500 block">Amount:</span>
                            <span className="font-bold text-white">
                              {msg.action.amount || '0.001'} {msg.action.intent === 'BUY' ? 'ETH' : '$' + (msg.action.tokenSymbol || 'TOKEN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Token:</span>
                            <span className="font-bold text-white font-mono truncate block">
                              ${msg.action.tokenSymbol || 'PONSCORE'}
                            </span>
                          </div>
                        </div>

                        {statusStep && (
                          <div className="text-[11px] text-purple-300 bg-purple-950/40 border border-purple-800/40 px-2 py-1 rounded">
                            {statusStep}
                          </div>
                        )}

                        {txHash && (
                          <a
                            href={`https://robinhoodchain.blockscout.com/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline text-[11px] font-bold flex items-center gap-1"
                          >
                            <span>VIEW TX ON BLOCKSCOUT ↗</span>
                          </a>
                        )}

                        {!txHash && (
                          <button
                            onClick={() => handleExecuteTrade(msg.action)}
                            disabled={isExecuting}
                            className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase rounded transition-all shadow-md cursor-pointer disabled:opacity-50"
                          >
                            {isExecuting ? 'EXECUTING ON-CHAIN...' : `CONFIRM ${msg.action.intent} ORDER`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* 6. Tabs & Subtitle Section */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#181a24] text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              Chat with Ponscore
            </button>
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-[#181a24] text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              Explore Agentic Economy
            </button>
            <button
              onClick={() => setActiveTab('build')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'build'
                  ? 'bg-[#181a24] text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              Build with Ponscore Tools
            </button>
          </div>

          <p className="text-xs text-zinc-400 font-sans">
            Ask Ponscore anything. Trade, analyze, automate, build — all from chat.
          </p>
        </div>

        {/* 7. Suggestion Cards Grid (2-Column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {/* Card 1 */}
          <div className="bg-[#0e1017] border border-[#1c1f2b] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg">
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-white">
                &ldquo;What&apos;s trending on Robinhood Chain right now?&rdquo;
              </h4>
              <div className="flex items-center gap-2">
                <span className="bg-[#181a24] text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-900/40">
                  Discover
                </span>
                <span className="bg-[#181a24] text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-900/40">
                  Token activity
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSendMessage("What's trending on Robinhood Chain right now?")}
              className="w-full py-2 rounded-xl bg-[#181a24] hover:bg-[#222534] border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Send to chat
            </button>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0e1017] border border-[#1c1f2b] hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all shadow-lg">
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-bold text-white">
                &ldquo;Analyze $PONSCORE — should I add to my position?&rdquo;
              </h4>
              <div className="flex items-center gap-2">
                <span className="bg-[#181a24] text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-900/40">
                  Wallet
                </span>
                <span className="bg-[#181a24] text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-purple-900/40">
                  Analysis
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSendMessage('Analyze $PONSCORE — should I add to my position?')}
              className="w-full py-2 rounded-xl bg-[#181a24] hover:bg-[#222534] border border-zinc-800 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Send to chat
            </button>
          </div>
        </div>
      </main>

      {/* Embedded Create Token Modal */}
      <CreateTokenModal
        open={launchModalOpen}
        onClose={() => setLaunchModalOpen(false)}
        initialSymbol={launchModalData.symbol}
        initialName={launchModalData.name}
        onTokenCreated={async (newTokenCa) => {
          if (!newTokenCa) return
          let info = null
          try {
            info = await getPonsTokenInfo(newTokenCa)
          } catch {
            /* continue */
          }
          const sym = info?.symbol || launchModalData.symbol || 'TOKEN'
          const successMsg: ChatMessage = {
            id: `agent-launched-${Date.now()}`,
            role: 'assistant',
            content: `Token $${sym} has been successfully deployed on Robinhood Chain!\n\nContract Address:\n${newTokenCa}`,
            timestamp: Date.now(),
            action: {
              intent: 'BUY',
              tokenAddress: newTokenCa,
              tokenSymbol: sym,
              tokenInfo: info,
              amount: '0.001',
              amountType: 'ETH',
              confidence: 1.0,
            },
          }
          setMessages((prev) => [...prev, successMsg])
        }}
      />
    </div>
  )
}
