'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  parseEther,
  parseUnits,
  formatUnits,
  getAddress,
  encodeFunctionData,
  maxUint256,
  erc20Abi,
  createPublicClient,
  http,
  isAddress,
} from 'viem'
import { usePrivy, useLoginWithOAuth, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import { activeChain, robinhoodChain } from '@/lib/chains'
import { PONS_CURVE_ABI, getPonsTokenInfo } from '@/lib/pons-v2'
import Button from '@/components/ui/Button'
import SparkleIcon from '@/components/ui/SparkleIcon'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'
import { ChatMessage, ParsedActionData } from '@/lib/chat-agent'
import CreateTokenModal from '@/components/launchpad/CreateTokenModal'

interface AiChatWidgetProps {
  initialTokenAddress?: string
  initialTokenSymbol?: string
  fullScreen?: boolean
  onClose?: () => void
}

const ROBINHOOD_CHAIN_ID = 4663
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`
const UNIVERSAL_ROUTER = '0x8876789976decbfcbbbe364623c63652db8c0904' as `0x${string}`

const PERMIT2_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
    ],
    outputs: [],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [
      { name: 'amount', type: 'uint160' },
      { name: 'expiration', type: 'uint48' },
      { name: 'nonce', type: 'uint48' },
    ],
  },
] as const

const QUICK_SUGGESTIONS = [
  { label: 'Explore Tokens', prompt: 'explore tokens' },
  { label: 'Check Balance', prompt: 'check my balance' },
  { label: 'How to launch token', prompt: 'how to launch a new token?' },
  { label: 'Buy $10 of Token', prompt: 'buy 10$ ' },
  { label: 'Sell All Tokens', prompt: 'sell all ' },
]

export default function AiChatWidget({
  initialTokenAddress,
  initialTokenSymbol,
  fullScreen = false,
  onClose,
}: AiChatWidgetProps) {
  const { theme } = useTheme()
  const { user, authenticated, ready } = usePrivy()
  const { wallets } = useWallets()
  const { address, balance, embeddedWallet, refetchBalance } = useWallet()
  const [, setLoggingIn] = useState(false)
  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => setLoggingIn(false),
    onError: () => setLoggingIn(false),
  })

  // Chat message state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content:
          'PONSTHINK AI Trading Assistant online.\nI can parse and execute DeFi trading commands directly on Robinhood Chain.\n\nExamples:\n- `buy 10$ 0xf373...` or `buy 0.005 ETH 0x...`\n- `sell all 0xf373...` or `sell 50% 0x...`\n- `check balance` or `launch token $PEPE`\n\nEnter your command below.',
        timestamp: Date.now(),
      },
    ]
  })

  const [input, setInput] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [executingMap, setExecutingMap] = useState<Record<string, boolean>>({})
  const [txSuccessMap, setTxSuccessMap] = useState<Record<string, string>>({})
  const [statusStepMap, setStatusStepMap] = useState<Record<string, string>>({})
  const [launchModalOpen, setLaunchModalOpen] = useState(false)
  const [launchModalData, setLaunchModalData] = useState<{ symbol?: string; name?: string }>({})

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loadingAi, scrollToBottom])

  // Handle Send Message
  async function handleSendMessage(customText?: string) {
    const textToSend = (customText || input).trim()
    if (!textToSend || loadingAi) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!customText) setInput('')
    setLoadingAi(true)

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
          userAddress: address,
          userTwitter: user?.twitter?.username,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: Date.now(),
          action: data.action,
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        throw new Error(data.error || 'Failed to process AI command')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching AI server'
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Unable to process command: ${msg}`,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoadingAi(false)
    }
  }

  // Handle Swap Execution from Action Card (Always use Server Wallet)
  async function handleExecuteTrade(msgId: string, action: ParsedActionData) {
    if (!action.tokenAddress || !isAddress(action.tokenAddress)) {
      toast.error('Invalid token contract address')
      return
    }

    if (!address) {
      toast('Please connect your account first')
      setLoggingIn(true)
      await initOAuth({ provider: 'twitter' })
      return
    }

    const isBuy = action.intent === 'BUY'
    const tokenAddr = getAddress(action.tokenAddress)
    const externalWallet = wallets?.find((w) => w.walletClientType !== 'privy')

    setExecutingMap((prev) => ({ ...prev, [msgId]: true }))

    try {
      const pubClient = createPublicClient({
        chain: robinhoodChain,
        transport: http('https://robinhood-rpc.publicnode.com'),
      })

      // Ensure full token info is loaded
      let token = action.tokenInfo
      if (!token || !token.curveAddress) {
        token = await getPonsTokenInfo(tokenAddr)
      }

      const symbol = token?.symbol || action.tokenSymbol || 'TOKEN'
      const isGraduated = token?.graduated || token?.phase === 2
      const isCurve = !isGraduated && (token?.phase === 0 || token?.phase === undefined)
      const curveAddress = token?.curveAddress

      // Calculate exact amount for sell
      let amountToSwap = action.amount || (isBuy ? '0.001' : 'all')
      let tokensInWei = 0n

      if (!isBuy) {
        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Verifying token balance...' }))
        const userBalRaw = await pubClient.readContract({
          address: tokenAddr,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [getAddress(address)],
        }).catch(() => 0n)

        if (userBalRaw <= 0n) {
          throw new Error(`Your balance for $${symbol} is 0. Nothing to sell.`)
        }

        if (action.isAll || action.amount === 'all' || !action.amount || action.percentage === 100) {
          tokensInWei = userBalRaw
        } else if (action.percentage && action.percentage > 0) {
          tokensInWei = (userBalRaw * BigInt(action.percentage)) / 100n
        } else {
          try {
            tokensInWei = parseUnits(action.amount, 18)
          } catch {
            tokensInWei = userBalRaw
          }
        }

        if (tokensInWei > userBalRaw) tokensInWei = userBalRaw
        if (tokensInWei <= 0n) throw new Error('Calculated sell amount is 0.')

        amountToSwap = formatUnits(tokensInWei, 18)
      }

      // ── ROUTE 1: CONNECTED EXTERNAL WALLET (MetaMask, Rabby, WalletConnect) ──
      if (externalWallet) {
        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Awaiting MetaMask signature...' }))
        try {
          await externalWallet.switchChain(ROBINHOOD_CHAIN_ID)
        } catch { /* ignore */ }
        const provider = await externalWallet.getEthereumProvider()

        const { createWalletClient, custom } = await import('viem')
        const walletClient = createWalletClient({
          chain: activeChain,
          transport: custom(provider),
        })
        const [account] = await walletClient.getAddresses()
        const userAddr = getAddress(account || address)

        const ethBal = await pubClient.getBalance({ address: userAddr })
        if (ethBal === 0n || (isBuy && ethBal < parseEther(amountToSwap))) {
          throw new Error(
            isBuy
              ? `Insufficient ETH balance (${formatUnits(ethBal, 18)} ETH) to buy.`
              : 'Insufficient ETH in your wallet to cover the transaction gas fee.'
          )
        }

        let txHash = ''

        if (isCurve && curveAddress) {
          if (isBuy) {
            setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Submitting buy order to curve...' }))
            const quoteIn = parseEther(amountToSwap)
            const calldata = encodeFunctionData({
              abi: PONS_CURVE_ABI,
              functionName: 'buy',
              args: [quoteIn, 0n, userAddr],
            })

            let gasLimit: bigint | undefined = undefined
            try {
              const est = await pubClient.estimateGas({
                account,
                to: getAddress(curveAddress),
                value: quoteIn,
                data: calldata,
              })
              gasLimit = (est * 120n) / 100n
            } catch {
              gasLimit = 250000n
            }

            txHash = await walletClient.sendTransaction({
              account,
              to: getAddress(curveAddress),
              value: quoteIn,
              data: calldata,
              ...(gasLimit ? { gas: gasLimit } : {}),
            })
          } else {
            setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Checking token allowance...' }))
            const currentAllowance = await pubClient.readContract({
              address: tokenAddr,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [userAddr, getAddress(curveAddress)],
            })

            if (currentAllowance < tokensInWei) {
              setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Approving token on blockchain...' }))
              const approveHash = await walletClient.writeContract({
                account,
                address: tokenAddr,
                abi: erc20Abi,
                functionName: 'approve',
                args: [getAddress(curveAddress), maxUint256],
              })
              await pubClient.waitForTransactionReceipt({ hash: approveHash })
            }

            setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Submitting sell order to curve...' }))
            const calldata = encodeFunctionData({
              abi: PONS_CURVE_ABI,
              functionName: 'sell',
              args: [tokensInWei, 0n, userAddr],
            })

            let gasLimit: bigint | undefined = undefined
            try {
              const est = await pubClient.estimateGas({
                account,
                to: getAddress(curveAddress),
                data: calldata,
              })
              gasLimit = (est * 120n) / 100n
            } catch {
              gasLimit = 250000n
            }

            txHash = await walletClient.sendTransaction({
              account,
              to: getAddress(curveAddress),
              data: calldata,
              ...(gasLimit ? { gas: gasLimit } : {}),
            })
          }
        } else {
          // Uniswap V4
          if (!isBuy) {
            setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Checking Permit2 allowance...' }))
            const erc20Allowance = await pubClient.readContract({
              address: tokenAddr,
              abi: erc20Abi,
              functionName: 'allowance',
              args: [userAddr, PERMIT2],
            })
            if (erc20Allowance < tokensInWei) {
              setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Approving Permit2 on blockchain...' }))
              const appHash = await walletClient.writeContract({
                account,
                address: tokenAddr,
                abi: erc20Abi,
                functionName: 'approve',
                args: [PERMIT2, maxUint256],
              })
              await pubClient.waitForTransactionReceipt({ hash: appHash })
            }

            const [permit2Allowance, expiration] = (await pubClient.readContract({
              address: PERMIT2,
              abi: PERMIT2_ABI,
              functionName: 'allowance',
              args: [userAddr, tokenAddr, UNIVERSAL_ROUTER],
            })) as [bigint, number, number]

            const nowSec = BigInt(Math.floor(Date.now() / 1000))
            if (permit2Allowance < tokensInWei || BigInt(expiration) <= nowSec) {
              setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Authorizing Universal Router...' }))
              const p2AppHash = await walletClient.writeContract({
                account,
                address: PERMIT2,
                abi: PERMIT2_ABI,
                functionName: 'approve',
                args: [
                  tokenAddr,
                  UNIVERSAL_ROUTER,
                  (1n << 160n) - 1n,
                  Math.floor(Date.now() / 1000) + 30 * 86400,
                ],
              })
              await pubClient.waitForTransactionReceipt({ hash: p2AppHash })
            }
          }

          setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Fetching Uniswap route...' }))
          const amountInWei = isBuy
            ? parseEther(amountToSwap).toString()
            : tokensInWei.toString()

          const swapRes = await fetch('/api/uniswap/swap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isBuy,
              tokenAddress: tokenAddr,
              amountIn: amountInWei,
              minAmountOut: '1',
              deadline: Math.floor(Date.now() / 1000) + 1200,
              hookAddress: token?.poolKey?.hooks || '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044',
              fee: token?.poolFee || 0,
              tickSpacing: token?.tickSpacing || 200,
            }),
          })

          const swapJson = await swapRes.json()
          if (!swapJson.success && swapJson.error) {
            throw new Error(swapJson.error)
          }

          const targetTo = (swapJson.to || UNIVERSAL_ROUTER) as `0x${string}`
          const targetValue = isBuy ? parseEther(amountToSwap) : 0n
          const targetData = (swapJson.data || '0x') as `0x${string}`

          let gasLimit: bigint | undefined = undefined
          try {
            const est = await pubClient.estimateGas({
              account,
              to: targetTo,
              value: targetValue,
              data: targetData,
            })
            gasLimit = (est * 120n) / 100n
          } catch {
            gasLimit = 350000n
          }

          setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Confirming transaction in wallet...' }))
          txHash = await walletClient.sendTransaction({
            account,
            to: targetTo,
            value: targetValue,
            data: targetData,
            ...(gasLimit ? { gas: gasLimit } : {}),
          })
        }

        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Waiting block confirmation...' }))
        await pubClient.waitForTransactionReceipt({ hash: txHash as `0x${string}` })

        toast.success(isBuy ? `Swap Successful: Bought $${symbol}` : `Swap Successful: Sold $${symbol}`)
        setTxSuccessMap((prev) => ({ ...prev, [msgId]: txHash }))
        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Confirmed on-chain' }))
        await refetchBalance()
      } else {
        // ── ROUTE 2: SOCIAL / SERVER WALLET (Twitter, Google) ──
        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Signing via Privy Server Wallet...' }))
        const srvSwapRes = await fetch('/api/launchpad/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            twitterHandle: user?.twitter?.username,
            tokenAddress: tokenAddr,
            isBuy,
            amount: amountToSwap,
            slippage: action.slippage || 1.0,
          }),
        })

        const srvJson = await srvSwapRes.json().catch(() => ({}))

        if (!srvSwapRes.ok || !srvJson?.success) {
          throw new Error(srvJson?.error || 'Swap execution failed on server wallet')
        }

        toast.success(
          isBuy
            ? `Swap Successful: Bought $${symbol}`
            : `Swap Successful: Sold $${symbol} for ETH`
        )
        setTxSuccessMap((prev) => ({
          ...prev,
          [msgId]: srvJson.txHash || 'confirmed',
        }))
        setStatusStepMap((prev) => ({ ...prev, [msgId]: 'Confirmed on-chain via Server Wallet' }))
        await refetchBalance()
      }
    } catch (err: unknown) {
      console.error('Trade Execution error:', err)
      let rawMsg = err instanceof Error ? err.message : String(err)
      if (rawMsg.toLowerCase().includes('exceeds the balance') || rawMsg.toLowerCase().includes('insufficient funds')) {
        rawMsg = 'Insufficient ETH in wallet to cover gas fee. Please deposit a small amount of ETH.'
      }
      toast.error(rawMsg.slice(0, 100))
      setStatusStepMap((prev) => ({ ...prev, [msgId]: `Failed: ${rawMsg.slice(0, 55)}` }))
    } finally {
      setExecutingMap((prev) => ({ ...prev, [msgId]: false }))
    }
  }

  return (
    <div
      className={`flex flex-col apple-glass overflow-hidden select-none ${
        fullScreen ? 'w-full h-full min-h-[75vh]' : 'w-full max-w-2xl h-[580px]'
      }`}
    >
      {/* Header Bar */}
      <div className="bg-white/[0.04] border-b border-white/[0.08] px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
              <SparkleIcon size={18} className="text-[#0A84FF]" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#30D158] border-2 border-[#0B0B0D]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F5F5F7] tracking-tight">
                PONSTHINK Assistant
              </span>
              <span className="text-[10px] font-medium bg-[#30D158]/15 text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/30">
                Online
              </span>
            </div>
            <span className="text-xs text-[#A1A1A6] hidden sm:inline">
              Natural language trading on Robinhood Chain
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] cursor-pointer transition-all active:scale-95"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar bg-transparent">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          const action = msg.action
          const isTradeAction = action && (action.intent === 'BUY' || action.intent === 'SELL') && (!!action.tokenAddress || !!action.tokenSymbol)
          const isExecuting = executingMap[msg.id]
          const txHash = txSuccessMap[msg.id]
          const statusStep = statusStepMap[msg.id]
          const token = action?.tokenInfo
          const isBuy = action?.intent === 'BUY'
          const externalWallet = wallets?.find((w) => w.walletClientType !== 'privy')

          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Label */}
              <span className="text-[11px] font-medium text-[#6E6E73] px-2">
                {isUser ? 'You' : 'PONSTHINK AI'}
              </span>

              {/* Chat Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#0A84FF] text-white rounded-3xl rounded-tr-md shadow-[0_4px_16px_rgba(10,132,255,0.35)]'
                    : 'bg-white/[0.06] backdrop-blur-2xl text-[#F5F5F7] border border-white/[0.10] rounded-3xl rounded-tl-md shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                {/* Interactive Action Card if AI parsed trade */}
                {isTradeAction && action && (
                  <div className="mt-4 bg-[#0B0B0D]/80 border border-white/[0.12] rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isBuy
                              ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? 'Buy Order' : 'Sell Order'}
                        </span>
                        <span className="text-xs font-semibold text-[#F5F5F7]">
                          ${token?.symbol || action.tokenSymbol || 'TOKEN'}
                        </span>
                      </div>

                      {token?.graduated ? (
                        <span className="text-[10px] font-medium bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Uniswap V4
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Bonding Curve
                        </span>
                      )}
                    </div>

                    {/* Token & Amount Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col">
                        <span className="text-[10px] text-[#A1A1A6] font-medium">
                          {isBuy ? 'Pay Amount' : 'Sell Amount'}
                        </span>
                        <span className="font-semibold text-[#F5F5F7] truncate mt-1">
                          {action.amountType === 'USD'
                            ? `$${action.amountRawValue} (~${action.amount} ETH)`
                            : action.isAll
                            ? `MAX (100%)`
                            : `${action.amount} ${isBuy ? 'ETH' : token?.symbol || 'Tokens'}`}
                        </span>
                      </div>

                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col">
                        <span className="text-[10px] text-[#A1A1A6] font-medium">
                          Token Address
                        </span>
                        <span className="font-mono text-[11px] text-[#0A84FF] truncate mt-1">
                          {action.tokenAddress
                            ? `${action.tokenAddress.slice(0, 6)}...${action.tokenAddress.slice(-4)}`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Progress / Status Step */}
                    {statusStep && (
                      <div className="flex items-center gap-2 bg-white/[0.04] px-3 py-2 rounded-xl border border-white/[0.06] text-xs text-[#A1A1A6]">
                        {isExecuting ? (
                          <Spinner size="sm" />
                        ) : txHash ? (
                          <span className="text-[#30D158] font-bold">✓</span>
                        ) : null}
                        <span className="truncate">{statusStep}</span>
                      </div>
                    )}

                    {/* Tx Success Explorer Link */}
                    {txHash && (
                      <div className="bg-[#30D158]/10 border border-[#30D158]/30 rounded-xl p-3 flex items-center justify-between text-xs">
                        <span className="text-[#30D158] font-semibold">Transaction Confirmed</span>
                        <a
                          href={`https://robinhoodchain.blockscout.com/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black bg-[#30D158] hover:bg-[#34C759] px-2.5 py-1 rounded-full font-semibold text-[11px] transition-all shadow-sm"
                        >
                          View Explorer ↗
                        </a>
                      </div>
                    )}

                    {/* Action Button */}
                    {!txHash && (
                      <Button
                        variant={isBuy ? 'primary' : 'danger'}
                        size="sm"
                        loading={isExecuting}
                        disabled={isExecuting}
                        onClick={() => handleExecuteTrade(msg.id, action)}
                        className="w-full py-2.5 text-xs font-semibold rounded-xl"
                      >
                        {isExecuting
                          ? 'Executing Swap...'
                          : isBuy
                          ? `Confirm Buy $${token?.symbol || action.tokenSymbol || ''}`
                          : `Confirm Sell $${token?.symbol || action.tokenSymbol || ''}`}
                      </Button>
                    )}
                  </div>
                )}

                {/* Interactive Launch Card if AI parsed token launch */}
                {action && action.intent === 'LAUNCH' && (
                  <div className="mt-4 bg-[#0B0B0D]/80 border border-white/[0.12] rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30">
                          Token Launcher
                        </span>
                        <span className="text-xs font-semibold text-[#F5F5F7]">
                          ${action.tokenSymbol || action.tokenName || 'TOKEN'}
                        </span>
                      </div>

                      <span className="text-[10px] font-medium bg-[#30D158]/20 text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/30">
                        Bonding Curve
                      </span>
                    </div>

                    {/* Token Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col">
                        <span className="text-[10px] text-[#A1A1A6] font-medium">
                          Token Symbol
                        </span>
                        <span className="font-semibold text-[#F5F5F7] truncate mt-1">
                          ${action.tokenSymbol || 'TOKEN'}
                        </span>
                      </div>

                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col">
                        <span className="text-[10px] text-[#A1A1A6] font-medium">
                          Est. Fee
                        </span>
                        <span className="font-mono text-[11px] text-[#0A84FF] truncate mt-1">
                          ~0.0005 ETH
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setLaunchModalData({
                          symbol: action.tokenSymbol,
                          name: action.tokenName || action.tokenSymbol,
                        })
                        setLaunchModalOpen(true)
                      }}
                      className="w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                    >
                      <SparkleIcon size={14} />
                      Deploy ${action.tokenSymbol || 'Token'} on Launchpad
                    </Button>
                  </div>
                )}

                {/* Interactive Wallet Overview Card if AI parsed wallet balance check */}
                {action && action.intent === 'WALLET_QUERY' && (
                  <div className="mt-4 bg-[#0B0B0D]/80 border border-white/[0.12] rounded-2xl p-4 flex flex-col gap-3.5 shadow-md">
                    <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30">
                          Wallet Overview
                        </span>
                        <span className="text-xs font-medium text-[#A1A1A6]">
                          {externalWallet ? 'Connected Wallet' : 'Privy Server Wallet'}
                        </span>
                      </div>

                      <span className="text-[10px] font-medium bg-[#30D158]/20 text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/30">
                        Robinhood Chain
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col">
                        <span className="text-[10px] text-[#A1A1A6] font-medium">
                          ETH Balance
                        </span>
                        <span className="font-semibold text-[#30D158] truncate mt-1 text-sm sm:text-base">
                          {balance?.formatted ? `${parseFloat(balance.formatted).toFixed(4)} ETH` : '0.0000 ETH'}
                        </span>
                        <span className="text-[11px] text-[#6E6E73] mt-0.5">
                          ≈ ${balance?.formatted ? (parseFloat(balance.formatted) * 2500).toFixed(2) : '0.00'} USD
                        </span>
                      </div>

                      <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.06] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-[#A1A1A6] font-medium">
                            Active Address
                          </span>
                          <span className="font-mono text-[11px] text-[#0A84FF] truncate block mt-1">
                            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not Connected'}
                          </span>
                        </div>

                        {address && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(address)
                              toast.success('Wallet address copied to clipboard!')
                            }}
                            className="text-[10px] text-[#A1A1A6] hover:text-[#F5F5F7] bg-white/[0.06] hover:bg-white/[0.12] px-2 py-1 rounded-full border border-white/[0.08] mt-2 self-start cursor-pointer transition-colors"
                          >
                            Copy Address
                          </button>
                        )}
                      </div>
                    </div>

                    {address && (
                      <div className="flex gap-2">
                        <a
                          href={`https://robinhoodchain.blockscout.com/address/${address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 text-center py-2 text-xs font-medium text-[#F5F5F7] bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-xl transition-all shadow-sm"
                        >
                          View Explorer ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => refetchBalance()}
                          className="px-3.5 py-2 text-xs font-semibold bg-white text-black hover:bg-[#F5F5F7] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          Refresh
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* AI Typing Spinner */}
        {loadingAi && (
          <div className="flex items-center gap-2 text-[#A1A1A6] text-xs py-2 px-1">
            <Spinner size="sm" />
            <span className="animate-pulse">Analyzing command parameters...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="bg-white/[0.03] border-t border-white/[0.08] px-4 py-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar flex-shrink-0">
        <span className="text-[11px] font-medium text-[#6E6E73] flex-shrink-0">
          Suggestions:
        </span>
        {QUICK_SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(s.prompt)}
            className="text-xs font-medium text-[#A1A1A6] hover:text-[#F5F5F7] hover:bg-white/[0.10] px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] whitespace-nowrap transition-all cursor-pointer flex-shrink-0 shadow-sm active:scale-95"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="bg-white/[0.04] border-t border-white/[0.08] p-3 sm:p-4 flex items-center gap-2.5 flex-shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type 'buy 10$ 0x...', 'sell all 0x...', 'check balance'..."
          disabled={loadingAi}
          className="flex-1 apple-input px-4 py-2.5 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#6E6E73] focus:outline-none rounded-full"
        />

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || loadingAi}
          loading={loadingAi}
          className="px-5 py-2.5 text-xs font-semibold rounded-full flex-shrink-0"
        >
          Send
        </Button>
      </form>

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
            content: `Token $${sym} has been successfully deployed to the Pons V2 Bonding Curve on Robinhood Chain!\n\nContract Address:\n${newTokenCa}\n\nYou can now trade $${sym} directly below:`,
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
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }}
      />
    </div>
  )
}
