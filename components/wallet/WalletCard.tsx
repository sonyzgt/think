'use client'

import { useWallet } from '@/hooks/useWallet'
import { activeChain } from '@/lib/chains'
import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { createPublicClient, http, erc20Abi, formatEther, encodeFunctionData, getAddress } from 'viem'
import { useSendTransaction, usePrivy, useWallets } from '@privy-io/react-auth'
import SparkleIcon from '@/components/ui/SparkleIcon'

interface WalletCardProps {
  onSend: () => void
  onReceive: () => void
  onSwap: () => void
  onClaimRoyalties?: () => void
}

const WETH_ADDR = '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73' as `0x${string}`

const WETH_ABI = [
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'wad', type: 'uint256' }],
    outputs: [],
  },
] as const

export default function WalletCard({ onSend, onReceive, onSwap, onClaimRoyalties }: WalletCardProps) {
  const { address, balance, creatingWallet, createWallet, refetchBalance, embeddedWallet } = useWallet()
  const { sendTransaction } = useSendTransaction()
  const { user, logout } = usePrivy()
  const { wallets } = useWallets()
  const [copying, setCopying] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const [wethBalanceRaw, setWethBalanceRaw] = useState<bigint>(0n)
  const [wethBalanceFormatted, setWethBalanceFormatted] = useState<string>('0')
  const [unwrapping, setUnwrapping] = useState(false)

  const fetchWethBalance = useCallback(async () => {
    if (!address) return
    try {
      const pubClient = createPublicClient({ chain: activeChain, transport: http('https://robinhood-rpc.publicnode.com') })
      const bal = await pubClient.readContract({
        address: WETH_ADDR,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [getAddress(address)],
      })
      setWethBalanceRaw(bal)
      const formatted = formatEther(bal)
      setWethBalanceFormatted(parseFloat(formatted) < 0.0001 && bal > 0n ? formatted.slice(0, 8) : parseFloat(formatted).toFixed(4))
    } catch { /* ignore */ }
  }, [address])

  useEffect(() => {
    const t = setTimeout(() => { fetchWethBalance() }, 0)
    const interval = setInterval(fetchWethBalance, 5000)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [fetchWethBalance])

  async function handleUnwrapWeth() {
    if (!address || wethBalanceRaw === 0n || !embeddedWallet) return
    setUnwrapping(true)
    try {
      await embeddedWallet.switchChain(activeChain.id)
      const provider = await embeddedWallet.getEthereumProvider()
      const { createWalletClient, custom } = await import('viem')
      const walletClient = createWalletClient({
        chain: activeChain,
        transport: custom(provider),
      })
      const [account] = await walletClient.getAddresses()

      const data = encodeFunctionData({
        abi: WETH_ABI,
        functionName: 'withdraw',
        args: [wethBalanceRaw],
      })
      await walletClient.sendTransaction({
        account,
        to: WETH_ADDR,
        data,
      })
      toast.success('Successfully unwrapped WETH to Native ETH!')
      await Promise.all([refetchBalance(), fetchWethBalance()])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed'
      if (msg.includes('cancel') || msg.includes('reject')) {
        toast.error('Unwrap canceled.')
      } else {
        toast.error(`${msg.slice(0, 100)}`)
      }
    } finally {
      setUnwrapping(false)
    }
  }

  async function copyAddress() {
    if (!address) return
    setCopying(true)
    await navigator.clipboard.writeText(address)
    toast.success('Address copied to clipboard!')
    setTimeout(() => setCopying(false), 1500)
  }

  const explorerUrl = `${activeChain.blockExplorers.default.url}/address/${address}`

  return (
    <div className="apple-glass p-6 sm:p-8 w-full relative overflow-hidden select-none">
      {/* Header status */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center">
            <SparkleIcon size={18} className="text-[#0A84FF]" />
          </div>
          <span className="text-sm font-semibold text-[#F5F5F7]">
            Wallet & Assets
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onClaimRoyalties && (
            <button
              onClick={onClaimRoyalties}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-[#F5F5F7] border border-white/[0.10] text-xs font-medium cursor-pointer transition-all active:scale-95"
            >
              <span>Creator Royalties</span>
            </button>
          )}
          <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 bg-white/[0.05] border border-white/[0.08] text-[#30D158] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.7)] animate-pulse" />
            Robinhood L2
          </span>
        </div>
      </div>

      {/* WETH Auto-Unwrap Banner */}
      {wethBalanceRaw > 0n && (
        <div className="mb-5 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-amber-300">
              Detected {wethBalanceFormatted} WETH
            </p>
            <p className="text-[11px] text-[#A1A1A6] mt-0.5">
              Unwrap to combine directly into your Native ETH balance
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            loading={unwrapping}
            onClick={handleUnwrapWeth}
            className="text-xs font-semibold py-1.5 px-4 w-full sm:w-auto flex-shrink-0 rounded-full"
          >
            Unwrap
          </Button>
        </div>
      )}

      {/* Native ETH Balance */}
      <div className="mb-6 bg-white/[0.04] border border-white/[0.10] p-5 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#A1A1A6] font-medium">
            Total Native Balance
          </span>
          <span className="text-[11px] font-medium bg-white/[0.06] text-[#A1A1A6] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
            ETH
          </span>
        </div>
        <div className="flex items-baseline gap-2.5 mt-1 flex-wrap">
          <span className="text-3xl sm:text-5xl font-bold text-[#F5F5F7] tracking-tight break-all">
            {balance ? balance.formatted : '0.000000'}
          </span>
          <span className="text-base font-semibold text-[#0A84FF]">ETH</span>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="mb-6">
        <p className="text-xs text-[#A1A1A6] font-medium mb-2">
          Account Address
        </p>
        {address ? (
          <div className="flex flex-col gap-2.5">
            <code
              className="text-xs font-mono text-[#F5F5F7] bg-white/[0.04] border border-white/[0.08] px-3.5 py-2.5 w-full overflow-hidden text-ellipsis select-all rounded-xl"
              title={address}
            >
              {address}
            </code>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyAddress}
                disabled={copying}
                className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[#F5F5F7] transition-all flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm active:scale-98"
                title="Copy Full Address"
              >
                {copying ? 'Copied!' : 'Copy Address'}
              </button>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-[#F5F5F7] transition-all flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer shadow-sm active:scale-98"
              >
                View Explorer ↗
              </a>
            </div>
            <button
              onClick={async () => {
                setDisconnecting(true)
                try {
                  if (Array.isArray(wallets) && wallets.length > 0) {
                    await Promise.allSettled(
                      wallets.map((w) => (typeof w.disconnect === 'function' ? w.disconnect() : Promise.resolve()))
                    )
                  }
                  await logout()
                  toast.success('Wallet disconnected')
                } catch (e) {
                  console.warn(e)
                } finally {
                  setDisconnecting(false)
                }
              }}
              disabled={disconnecting}
              className="py-2 px-3 w-full rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer active:scale-98"
              title="Disconnect Wallet"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect Wallet'}
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            loading={creatingWallet}
            onClick={() => createWallet()}
            variant="primary"
            className="w-full font-semibold text-xs py-3 rounded-xl"
          >
            {creatingWallet ? 'Creating...' : 'Create Embedded Wallet'}
          </Button>
        )}
      </div>

      {/* Action Buttons: Send, Receive, Swap */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          onClick={onSend}
          variant="secondary"
          className="w-full py-3 text-xs font-semibold rounded-xl"
          disabled={!address}
        >
          Send
        </Button>
        <Button
          onClick={onReceive}
          variant="secondary"
          className="w-full py-3 text-xs font-semibold rounded-xl"
          disabled={!address}
        >
          Receive
        </Button>
        <Button
          onClick={onSwap}
          variant="primary"
          className="w-full py-3 text-xs font-semibold rounded-xl"
          disabled={!address}
        >
          Swap
        </Button>
      </div>
    </div>
  )
}
