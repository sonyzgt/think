'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import SparkleIcon from '@/components/ui/SparkleIcon'
import TokenImage from '@/components/ui/TokenImage'
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
import {
  PonsV2TokenInfo,
  PONS_CURVE_ABI,
} from '@/lib/pons-v2'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { useTheme } from '@/context/ThemeContext'

interface TokenSwapWidgetProps {
  token: PonsV2TokenInfo
  onSwapSuccess?: () => void
}

// Robinhood Chain 4663 Constants
const ROBINHOOD_CHAIN_ID = 4663
const NATIVE_ETH = '0x0000000000000000000000000000000000000000'
const UNIVERSAL_ROUTER = '0x8876789976decbfcbbbe364623c63652db8c0904' as `0x${string}`
const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3' as `0x${string}`

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

interface UniswapQuoteResponse {
  success: boolean
  source: string
  routing?: string
  route?: string
  amountIn?: string
  amountOut?: string
  minAmountOut?: string
  priceNative?: number
  slippage?: number
  raw?: Record<string, unknown>
}

export default function TokenSwapWidget({ token, onSwapSuccess }: TokenSwapWidgetProps) {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { address, balance, embeddedWallet, refetchBalance } = useWallet()
  const { theme } = useTheme()
  const [loggingIn, setLoggingIn] = useState(false)

  const { initOAuth } = useLoginWithOAuth({
    onComplete: () => setLoggingIn(false),
    onError: () => setLoggingIn(false),
  })

  const [mode, setMode] = useState<'BUY' | 'SELL'>('BUY')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(1.0)
  const [showSettings, setShowSettings] = useState(false)

  const [tokenBalanceRaw, setTokenBalanceRaw] = useState<bigint>(0n)
  const [fetchingTokenBal, setFetchingTokenBal] = useState(false)

  const [needsApproval, setNeedsApproval] = useState(false)
  const [approving, setApproving] = useState(false)
  const [swapping, setSwapping] = useState(false)

  // Real-time Quote State
  const [quoteData, setQuoteData] = useState<UniswapQuoteResponse | null>(null)
  const [fetchingQuote, setFetchingQuote] = useState(false)
  const quoteAbortController = useRef<AbortController | null>(null)

  const isBuy = mode === 'BUY'
  const isGraduated = token.graduated || token.phase === 2
  const isCurve = !isGraduated && (token.phase === 0 || token.phase === undefined)
  const curveAddress = token.curveAddress
  const targetSpender = isCurve ? (curveAddress as `0x${string}`) : PERMIT2

  // Fetch token balance
  const fetchTokenBal = useCallback(async () => {
    if (!address || !token.tokenAddress || !isAddress(token.tokenAddress)) return
    setFetchingTokenBal(true)
    try {
      const pubClient = createPublicClient({
        chain: robinhoodChain,
        transport: http('https://robinhood-rpc.publicnode.com'),
      })
      const bal = await pubClient.readContract({
        address: getAddress(token.tokenAddress),
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [getAddress(address)],
      })
      setTokenBalanceRaw(bal)
    } catch {
      // ignore
    } finally {
      setFetchingTokenBal(false)
    }
  }, [address, token.tokenAddress])

  // Check allowance on sell
  const checkAllowance = useCallback(async () => {
    if (isBuy || !address || !token.tokenAddress || !isAddress(token.tokenAddress)) {
      setNeedsApproval(false)
      return
    }
    try {
      const pubClient = createPublicClient({
        chain: robinhoodChain,
        transport: http('https://robinhood-rpc.publicnode.com'),
      })
      const spender = targetSpender
      const allowance = await pubClient.readContract({
        address: getAddress(token.tokenAddress),
        abi: erc20Abi,
        functionName: 'allowance',
        args: [getAddress(address), spender],
      })
      const inputAmount = parseFloat(amount) || 0
      if (inputAmount > 0) {
        const requiredWei = parseUnits(amount, 18)
        setNeedsApproval(allowance < requiredWei)
      } else {
        setNeedsApproval(allowance === 0n)
      }
    } catch {
      setNeedsApproval(false)
    }
  }, [isBuy, address, token.tokenAddress, targetSpender, amount])

  useEffect(() => {
    fetchTokenBal()
  }, [fetchTokenBal])

  useEffect(() => {
    checkAllowance()
  }, [checkAllowance])

  // Fetch accurate quote when amount or token changes
  const [accurateQuote, setAccurateQuote] = useState<{
    estimatedOutput: number
    minReceived: number
    priceNative: number
    route?: string
  } | null>(null)

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0 || !token.tokenAddress) {
      setAccurateQuote(null)
      return
    }

    if (quoteAbortController.current) {
      quoteAbortController.current.abort()
    }
    const controller = new AbortController()
    quoteAbortController.current = controller

    const timer = setTimeout(async () => {
      setFetchingQuote(true)
      try {
        const res = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenAddress: token.tokenAddress,
            amount,
            isBuy,
            slippage,
          }),
          signal: controller.signal,
        })

        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            setAccurateQuote({
              estimatedOutput: data.estimatedOutput,
              minReceived: data.minReceived,
              priceNative: data.priceNative,
              route: data.route,
            })
          }
        }
      } catch (err: unknown) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Quote fetch error:', err)
        }
      } finally {
        setFetchingQuote(false)
      }
    }, 200)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isBuy, amount, token.tokenAddress, slippage])

  // Derived calculations
  const ethBalanceNum = balance ? parseFloat(balance.formatted) : 0
  const tokenBalanceNum = parseFloat(formatUnits(tokenBalanceRaw, 18))
  const amountNum = parseFloat(amount) || 0

  // Output estimation
  const estimatedOutput = useMemo(() => {
    if (amountNum <= 0) return 0

    if (accurateQuote && accurateQuote.estimatedOutput > 0) {
      return accurateQuote.estimatedOutput
    }

    // Default price fallback
    const priceNative =
      accurateQuote?.priceNative || token.priceNative || (isGraduated ? 0.00000000588 : 0.0000000025)
    if (isBuy) {
      return (amountNum * 0.985) / priceNative
    } else {
      return amountNum * priceNative * 0.985
    }
  }, [amountNum, isBuy, token.priceNative, isGraduated, accurateQuote])

  const minReceived = useMemo(() => {
    if (accurateQuote && accurateQuote.minReceived > 0) {
      return accurateQuote.minReceived
    }
    return estimatedOutput * (1 - slippage / 100)
  }, [estimatedOutput, slippage, accurateQuote])

  const hasSufficientBalance = isBuy
    ? amountNum > 0 && amountNum <= Math.max(0, ethBalanceNum - 0.00001)
    : amountNum > 0 && (tokenBalanceNum > 0 ? amountNum <= tokenBalanceNum * 1.05 : true)

  // Dynamic Execution Route
  const executionRouteDisplay = useMemo(() => {
    if (accurateQuote?.route) return accurateQuote.route
    if (isCurve) return 'PONS V2 BONDING CURVE'
    return 'UNISWAP V4'
  }, [accurateQuote, isCurve])

  // Handle Swap Execution
  async function handleSwap() {
    if (!address || amountNum <= 0) return
    setSwapping(true)

    try {
      // 1. Try server wallet swap first (Privy Server Wallet)
      const srvSwapRes = await fetch('/api/launchpad/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          twitterHandle: user?.twitter?.username,
          tokenAddress: token.tokenAddress,
          isBuy,
          amount,
          slippage,
        }),
      })

      const srvJson = await srvSwapRes.json().catch(() => ({}))

      if (srvSwapRes.ok && srvJson?.success) {
        toast.success(isBuy ? `Swap successful! Bought $${token.symbol}` : `Swap successful! Sold $${token.symbol} for ETH`)
        await Promise.all([refetchBalance(), fetchTokenBal()])
        setAmount('')
        if (onSwapSuccess) onSwapSuccess()
        return
      }

      // 2. Fallback to connected wallet (WalletConnect / MetaMask / Rabby / Privy embedded)
      const activeWallet = wallets?.find(w => w.address?.toLowerCase() === address?.toLowerCase()) || wallets?.[0] || embeddedWallet

      let provider: any
      if (activeWallet) {
        try {
          await activeWallet.switchChain(ROBINHOOD_CHAIN_ID)
        } catch { /* continue */ }
        provider = await activeWallet.getEthereumProvider()
      } else if (typeof window !== 'undefined' && (window as any).ethereum) {
        provider = (window as any).ethereum
      } else {
        throw new Error(srvJson?.error || 'No connected wallet found. Please connect your wallet.')
      }

      const { createWalletClient, custom } = await import('viem')
      const walletClient = createWalletClient({
        chain: activeChain,
        transport: custom(provider),
      })
      const [account] = await walletClient.getAddresses()
      const userAddr = getAddress(account || address)

      const pubClient = createPublicClient({
        chain: robinhoodChain,
        transport: http('https://robinhood-rpc.publicnode.com'),
      })

      if (isCurve) {
        // ── ROUTE 1: ACTIVE PONS V2 BONDING CURVE ──
        if (isBuy) {
          toast(`Buying $${token.symbol} on Bonding Curve...`)
          const quoteIn = parseEther(amount)
          const minTokensOut = 0n

          const calldata = encodeFunctionData({
            abi: PONS_CURVE_ABI,
            functionName: 'buy',
            args: [quoteIn, minTokensOut, userAddr],
          })

          const txHash = await walletClient.sendTransaction({
            account,
            to: getAddress(curveAddress as string),
            value: quoteIn,
            data: calldata,
            gas: 300000n,
          })

          toast('Confirming swap on blockchain...')
          await pubClient.waitForTransactionReceipt({ hash: txHash })
          toast.success(`Swap successful! Bought $${token.symbol}`)
        } else {
          toast(`Checking allowance for $${token.symbol}...`)
          const tokensIn = parseUnits(amount, 18)
          const minQuoteOut = 0n

          // Check allowance for bonding curve
          const currentAllowance = await pubClient.readContract({
            address: getAddress(token.tokenAddress),
            abi: erc20Abi,
            functionName: 'allowance',
            args: [userAddr, getAddress(curveAddress as string)],
          })

          if (currentAllowance < tokensIn) {
            toast(`Please approve $${token.symbol} in your wallet...`)
            const approveHash = await walletClient.writeContract({
              account,
              address: getAddress(token.tokenAddress),
              abi: erc20Abi,
              functionName: 'approve',
              args: [getAddress(curveAddress as string), maxUint256],
            })
            toast('Confirming token approval...')
            await pubClient.waitForTransactionReceipt({ hash: approveHash })
          }

          toast(`Confirm sell of $${token.symbol} in your wallet...`)
          const calldata = encodeFunctionData({
            abi: PONS_CURVE_ABI,
            functionName: 'sell',
            args: [tokensIn, minQuoteOut, userAddr],
          })

          const txHash = await walletClient.sendTransaction({
            account,
            to: getAddress(curveAddress as string),
            data: calldata,
            gas: 350000n,
          })

          toast('Confirming sell on blockchain...')
          await pubClient.waitForTransactionReceipt({ hash: txHash })
          toast.success(`Swap successful! Sold $${token.symbol} for ETH`)
        }
      } else {
        // ── ROUTE 2: UNISWAP TRADING API / UNIVERSAL ROUTER (GRADUATED) ──
        if (!isBuy) {
          toast(`Checking Permit2 allowance for $${token.symbol}...`)
          const erc20Allowance = await pubClient.readContract({
            address: getAddress(token.tokenAddress),
            abi: erc20Abi,
            functionName: 'allowance',
            args: [userAddr, PERMIT2],
          })
          if (erc20Allowance < parseUnits(amount, 18)) {
            toast(`Please approve $${token.symbol} on Permit2...`)
            const appHash = await walletClient.writeContract({
              account,
              address: getAddress(token.tokenAddress),
              abi: erc20Abi,
              functionName: 'approve',
              args: [PERMIT2, maxUint256],
            })
            toast('Confirming Permit2 approval...')
            await pubClient.waitForTransactionReceipt({ hash: appHash })
          }

          const [permit2Allowance, expiration] = (await pubClient.readContract({
            address: PERMIT2,
            abi: PERMIT2_ABI,
            functionName: 'allowance',
            args: [userAddr, getAddress(token.tokenAddress), UNIVERSAL_ROUTER],
          })) as [bigint, number, number]

          const nowSec = BigInt(Math.floor(Date.now() / 1000))
          if (permit2Allowance < parseUnits(amount, 18) || BigInt(expiration) <= nowSec) {
            toast(`Please approve Universal Router on Permit2...`)
            const p2AppHash = await walletClient.writeContract({
              account,
              address: PERMIT2,
              abi: PERMIT2_ABI,
              functionName: 'approve',
              args: [
                getAddress(token.tokenAddress),
                UNIVERSAL_ROUTER,
                (1n << 160n) - 1n,
                Math.floor(Date.now() / 1000) + 30 * 86400,
              ],
            })
            toast('Confirming router approval...')
            await pubClient.waitForTransactionReceipt({ hash: p2AppHash })
          }
        }

        toast(`Fetching Uniswap swap transaction for $${token.symbol}...`)

        const amountInWei = isBuy ? parseEther(amount).toString() : parseUnits(amount, 18).toString()
        const minAmountOutWei = quoteData?.minAmountOut || (isBuy ? parseUnits(Math.floor(minReceived).toString(), 18).toString() : parseEther(minReceived.toFixed(18)).toString())
        const deadline = Math.floor(Date.now() / 1000) + 1200

        const swapRes = await fetch('/api/uniswap/swap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isBuy,
            tokenAddress: token.tokenAddress,
            amountIn: amountInWei,
            minAmountOut: minAmountOutWei,
            deadline,
            hookAddress: token.poolKey?.hooks || '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044',
            fee: token.poolFee || 0,
            tickSpacing: token.tickSpacing || 200,
            quote: quoteData?.raw,
          }),
        })

        const swapJson = await swapRes.json()
        if (!swapJson.success && swapJson.error) {
          throw new Error(swapJson.error)
        }

        const targetTo = (swapJson.to || UNIVERSAL_ROUTER) as `0x${string}`
        const targetValue = isBuy ? parseEther(amount) : (swapJson.value ? BigInt(swapJson.value) : 0n)
        const targetData = (swapJson.data || '0x') as `0x${string}`

        let gasLimit = swapJson.gasLimit ? BigInt(swapJson.gasLimit) : 450000n
        try {
          const estimatedGas = await pubClient.estimateGas({
            account,
            to: targetTo,
            value: targetValue,
            data: targetData,
          })
          gasLimit = (estimatedGas * 120n) / 100n
        } catch { /* use safe gas */ }

        const txHash = await walletClient.sendTransaction({
          account,
          to: targetTo,
          value: targetValue,
          data: targetData,
          gas: gasLimit,
        })

        toast('Waiting for Uniswap transaction confirmation...')
        const receipt = await pubClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          toast.success(`Swap Successful on Uniswap!`)
        } else {
          throw new Error('Swap transaction reverted on-chain.')
        }
      }

      setAmount('')
      await Promise.all([refetchBalance(), fetchTokenBal()])
      if (onSwapSuccess) onSwapSuccess()
    } catch (err: unknown) {
      console.error('Swap execution error:', err)
      const rawMsg = err instanceof Error ? err.message : String(err)
      toast.error(rawMsg.slice(0, 120))
    } finally {
      setSwapping(false)
    }
  }

  return (
    <div className="flex flex-col bg-white border border-[#D8D8D8] rounded-xl p-4 gap-3 select-none text-[#111111] shadow-xs">
      {/* Buy / Sell Tabs */}
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 bg-[#F5F5F3] p-1 rounded-xl border border-[#E2E2E2] w-full">
          <button
            type="button"
            onClick={() => {
              setMode('BUY')
              setAmount('')
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isBuy
                ? 'bg-[#FF6A00] text-white shadow-xs'
                : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            Buy ${token.symbol}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('SELL')
              setAmount('')
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              !isBuy
                ? 'bg-[#D94F00] text-white shadow-xs'
                : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            Sell ${token.symbol}
          </button>
        </div>

        {/* Slippage Settings Button */}
        <button
          type="button"
          onClick={() => setShowSettings((p) => !p)}
          className="p-2 rounded-xl bg-[#F5F5F3] hover:bg-[#FFF0E6] text-[#777777] hover:text-[#FF6A00] border border-[#E2E2E2] hover:border-[#FF6A00] transition-all text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs active:scale-95"
          title="Slippage Settings"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{slippage}%</span>
        </button>
      </div>

      {/* Slippage Settings Drawer */}
      {showSettings && (
        <div className="bg-[#F5F5F3] border border-[#E2E2E2] rounded-xl p-3 flex flex-col gap-2 animate-fadeIn">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#777777]">Slippage Tolerance</span>
            <span className="text-[#FF6A00] font-bold">{slippage}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.5, 1.0, 2.5, 5.0].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlippage(s)}
                className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  slippage === s
                    ? 'bg-[#FF6A00] text-white border-[#D94F00] shadow-xs'
                    : 'bg-white text-[#777777] border-[#D8D8D8] hover:text-[#111111]'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Graduated Notification Banner */}
      {isGraduated && (
        <div className="bg-[#FFF7F2] border border-[#FFE0CC] rounded-xl p-3 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6A00] text-white rounded-md">
              Graduated
            </span>
            <span className="text-xs text-[#111111] font-bold">100% Raised → Uniswap v4 Locked</span>
          </div>
          <span className="text-[11px] text-[#FF6A00] font-bold hidden sm:inline">Uniswap Pool</span>
        </div>
      )}

      {/* Amount Input Box */}
      <div className="bg-[#F5F5F3] border border-[#E2E2E2] rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-[#777777]">
          <span className="font-bold">{isBuy ? 'You Pay' : `You Pay ($${token.symbol})`}</span>
          <div className="flex items-center gap-1.5">
            <span>
              Balance: {isBuy ? `${ethBalanceNum.toFixed(4)} ETH` : `${tokenBalanceNum.toLocaleString()} $${token.symbol}`}
            </span>
            <button
              type="button"
              onClick={() =>
                setAmount(
                  isBuy
                    ? Math.max(0, ethBalanceNum - 0.0002).toFixed(4)
                    : tokenBalanceNum >= 1
                    ? Math.floor(tokenBalanceNum).toString()
                    : tokenBalanceNum.toString()
                )
              }
              className="text-[#FF6A00] hover:underline font-bold cursor-pointer"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="flex-1 w-0 min-w-0 bg-transparent text-2xl font-black text-[#111111] placeholder-zinc-400 focus:outline-none"
          />

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#D8D8D8] flex-shrink-0 shadow-xs">
            {isBuy ? (
              <>
                <SparkleIcon size={14} className="text-[#FF6A00] flex-shrink-0" />
                <span className="text-xs font-bold text-[#111111]">ETH</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full overflow-hidden border border-[#D8D8D8] flex items-center justify-center bg-white">
                  <TokenImage
                    src={token.logo}
                    alt={token.symbol}
                    size={20}
                    sparkleSize={14}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-bold text-[#111111] truncate max-w-[80px]">
                  {token.symbol}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Amount Pills */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {isBuy
            ? [
                { label: '0.001', val: '0.001' },
                { label: '0.005', val: '0.005' },
                { label: '0.01', val: '0.01' },
                { label: '0.05', val: '0.05' },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setAmount(c.val)}
                  className="py-1 rounded-lg bg-white hover:bg-[#FFF0E6] text-[#777777] hover:text-[#FF6A00] border border-[#D8D8D8] hover:border-[#FF6A00] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {c.label} ETH
                </button>
              ))
            : [
                { label: '25%', pct: 0.25 },
                { label: '50%', pct: 0.5 },
                { label: '75%', pct: 0.75 },
                { label: '100%', pct: 1.0 },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    const raw = tokenBalanceNum * c.pct
                    setAmount(raw >= 1 ? Math.floor(raw).toString() : raw.toFixed(2))
                  }}
                  className="py-1 rounded-lg bg-white hover:bg-[#FFF0E6] text-[#777777] hover:text-[#FF6A00] border border-[#D8D8D8] hover:border-[#FF6A00] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  {c.label}
                </button>
              ))}
        </div>
      </div>

      {/* Output Preview */}
      <div className="bg-[#F5F5F3] border border-[#E2E2E2] rounded-xl p-3.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-[#777777]">
          <span className="font-bold">{isBuy ? 'You Receive' : 'You Receive (ETH)'}</span>
          <span className="text-[11px] text-[#888888] font-medium">
            {fetchingQuote ? 'Fetching quote...' : 'Estimated output'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xl font-black text-[#FF6A00] truncate">
            {estimatedOutput > 0
              ? isBuy
                ? estimatedOutput.toLocaleString('en-US', { maximumFractionDigits: 2 })
                : estimatedOutput.toFixed(6)
              : '0.00'}
          </span>
          <span className="text-xs font-bold text-[#111111] bg-white px-2.5 py-1 rounded-lg border border-[#D8D8D8] flex-shrink-0 shadow-2xs">
            {isBuy ? `$${token.symbol}` : 'ETH'}
          </span>
        </div>
      </div>

      {/* Breakdown Details */}
      <div className="bg-white border border-[#E2E2E2] rounded-xl p-3 flex flex-col gap-1 text-xs text-[#777777]">
        <div className="flex justify-between">
          <span>Min. Received ({slippage}% slip):</span>
          <span className="text-[#111111] font-bold">
            {minReceived > 0
              ? isBuy
                ? `${minReceived.toLocaleString('en-US', { maximumFractionDigits: 2 })} $${token.symbol}`
                : `${minReceived.toFixed(6)} ETH`
              : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Creator Tax:</span>
          <span className="font-bold text-[#FF6A00]">{(token.creatorTaxBps / 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Execution Route:</span>
          <span className="font-bold text-[#111111]">
            {executionRouteDisplay}
          </span>
        </div>
      </div>

      {/* Action Button */}
      {!authenticated || !address ? (
        <button
          type="button"
          onClick={async () => {
            setLoggingIn(true)
            await initOAuth({ provider: 'twitter' })
          }}
          className="w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl skeuo-button-primary text-white cursor-pointer shadow-md"
        >
          {loggingIn ? 'Connecting...' : 'Connect Wallet to Swap'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSwap}
          disabled={!hasSufficientBalance || swapping}
          className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer text-white shadow-md transition-all ${
            !hasSufficientBalance
              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed border border-zinc-400'
              : isBuy
              ? 'skeuo-button-primary'
              : 'bg-[#D94F00] hover:bg-[#FF6A00] border border-[#B83200]'
          }`}
        >
          {swapping
            ? 'Confirming Transaction...'
            : !hasSufficientBalance
            ? 'Insufficient Balance'
            : isBuy
            ? `Buy $${token.symbol} with ETH`
            : `Sell $${token.symbol} for ETH`}
        </button>
      )}

      {/* Quick External DEX links */}
      {isGraduated && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          <a
            href={`https://dexscreener.com/robinhood/${token.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 bg-[#F5F5F3] hover:bg-[#FFF0E6] text-[#555555] hover:text-[#FF6A00] border border-[#D8D8D8] text-[11px] font-bold text-center rounded-xl transition-all"
          >
            DexScreener ↗
          </a>
          <a
            href={`https://gmgn.ai/robinhood/token/${token.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 bg-[#F5F5F3] hover:bg-[#FFF0E6] text-[#555555] hover:text-[#FF6A00] border border-[#D8D8D8] text-[11px] font-bold text-center rounded-xl transition-all"
          >
            GMGN.ai ↗
          </a>
          <a
            href={`https://robinhoodchain.blockscout.com/token/${token.tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 bg-[#F5F5F3] hover:bg-[#FFF0E6] text-[#555555] hover:text-[#FF6A00] border border-[#D8D8D8] text-[11px] font-bold text-center rounded-xl transition-all"
          >
            Explorer ↗
          </a>
        </div>
      )}
    </div>
  )
}
