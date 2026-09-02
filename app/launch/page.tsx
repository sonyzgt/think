'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  parseEther,
  getAddress,
  encodeFunctionData,
  zeroAddress,
  formatEther,
  isAddress,
} from 'viem'
import { usePrivy, useLoginWithOAuth, useWallets } from '@privy-io/react-auth'
import { useWallet } from '@/hooks/useWallet'
import { activeChain } from '@/lib/chains'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import TokenImage from '@/components/ui/TokenImage'
import ClaimFeesModal from '@/components/launchpad/ClaimFeesModal'
import { useTheme } from '@/context/ThemeContext'
import {
  PONS_V2_FACTORY,
  LAUNCH_AND_BUY_ROUTER,
  FACTORY_ABI,
  LAUNCH_AND_BUY_ABI,
  getLaunchFee,
  getPreviewLaunchEconomics,
  generateRandomSalt,
  canLaunch,
} from '@/lib/pons-v2'

export default function LaunchPage() {
  const router = useRouter()
  const { user, authenticated, ready, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { address, embeddedWallet, balance, refetchBalance } = useWallet()
  const { theme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isConnected = !!address || authenticated

  // Navigation Modal States
  const [claimFeesOpen, setClaimFeesOpen] = useState(false)

  // ── Form State ─────────────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [logo, setLogo] = useState('')
  const [previewLogo, setPreviewLogo] = useState('')
  const [description, setDescription] = useState('')

  // Socials
  const [twitter, setTwitter] = useState('')
  const [telegram, setTelegram] = useState('')
  const [website, setWebsite] = useState('')
  const [discord, setDiscord] = useState('')
  const [farcaster, setFarcaster] = useState('')

  // Economics
  const [creatorTaxBps, setCreatorTaxBps] = useState<number>(100) // 100 - 500 (1.0% - 5.0%)
  const [buybackEnabled, setBuybackEnabled] = useState(false)
  const [initialBuyEth, setInitialBuyEth] = useState('')
  const [extraExemptions, setExtraExemptions] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Contract State
  const [launchFeeWei, setLaunchFeeWei] = useState<bigint>(500000000000000n)
  const [fetchingFee, setFetchingFee] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  // Ref to track the committed server URL — set after successful upload, read at launch time
  const committedLogoRef = useRef<string>('')

  const fetchFee = useCallback(async () => {
    setFetchingFee(true)
    try {
      const fee = await getLaunchFee()
      setLaunchFeeWei(fee > 0n ? fee : 500000000000000n)
    } catch {
      setLaunchFeeWei(500000000000000n)
    } finally {
      setFetchingFee(false)
    }
  }, [])

  useEffect(() => {
    fetchFee()
  }, [fetchFee])
  // Upload image to server and get short URL (< 200 chars for smart contract)
  async function uploadImageToServer(dataUrl: string): Promise<string> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) return data.url
      }
    } catch (e) {
      console.error('Upload failed:', e)
    }
    return ''
  }

  // Handle direct file upload from user device
  function handleImageFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, SVG, GIF)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new window.Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const maxDim = 512
        let w = img.width
        let h = img.height
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w)
            w = maxDim
          } else {
            w = Math.round((w * maxDim) / h)
            h = maxDim
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        let raw = event.target?.result as string
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          raw = canvas.toDataURL('image/webp', 0.90)
        }

        // 1. Show user's actual image preview immediately
        setPreviewLogo(raw)
        setLogo(raw)
        committedLogoRef.current = raw
        setUploadingImage(true)

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: raw }),
          })
          if (res.ok) {
            const data = await res.json()
            const serverUrl = data.relativeUrl || data.url || data.publicUrl || raw
            if (serverUrl) {
              committedLogoRef.current = data.url || serverUrl
              setLogo(serverUrl)
            }
          }
        } catch (e) {
          console.warn('Upload to server failed, using base64 fallback', e)
        } finally {
          setUploadingImage(false)
          toast.success('Logo siap digunakan!')
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)

  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) handleImageFile(file)
  }

  const ethBalance = balance ? parseFloat(balance.formatted) : 0
  const initialBuyNum = parseFloat(initialBuyEth) || 0
  const launchFeeEth = parseFloat(formatEther(launchFeeWei))
  const totalEthRequired = launchFeeEth + initialBuyNum

  const isFormValid =
    name.trim().length > 0 &&
    symbol.trim().length > 0 &&
    symbol.trim().length <= 10 &&
    !deploying

  const hasSufficientEth = ethBalance >= totalEthRequired

  async function handleLaunchToken() {
    if (!name.trim()) {
      toast.error('Please enter a Token Name.')
      return
    }
    if (!symbol.trim()) {
      toast.error('Please enter a Token Symbol / Ticker.')
      return
    }
    if (!address) {
      toast.error('Silakan hubungkan wallet Anda terlebih dahulu.')
      login()
      return
    }

    if (ethBalance > 0 && ethBalance < totalEthRequired) {
      toast.error(`Insufficient ETH balance. You need ~${totalEthRequired.toFixed(4)} ETH. Available: ${ethBalance.toFixed(4)} ETH.`)
      return
    }

    if (uploadingImage) {
      toast('⏳ Uploading logo... please wait a moment before launching.', { duration: 3000 })
      return
    }

    setDeploying(true)

    try {
      toast('Deploying token via Server Wallet on Robinhood Chain...')

      let finalLogo = committedLogoRef.current || logo.trim()
      if (finalLogo.startsWith('data:')) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: finalLogo }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.url) finalLogo = data.url
          }
        } catch { /* continue */ }
      }

      const launchRes = await fetch('/api/launchpad/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          twitterHandle: user?.twitter?.username,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          logo: finalLogo,
          description: description.trim(),
          socials: {
            twitter: twitter.trim(),
            telegram: telegram.trim(),
            discord: discord.trim(),
            website: website.trim(),
            farcaster: farcaster.trim(),
          },
          creatorTaxBps,
          buybackEnabled,
          initialBuyEth: initialBuyEth || '0',
          extraExemptions,
        }),
      })

      const launchJson = await launchRes.json().catch(() => ({}))

      let deployedTokenCa = ''

      if (launchRes.ok && launchJson?.success) {
        deployedTokenCa = launchJson.tokenAddress
      } else {
        // Fallback to connected wallet (MetaMask / Rabby / WalletConnect / Privy embedded)
        const activeWallet = wallets?.find(w => w.address?.toLowerCase() === address?.toLowerCase()) || wallets?.[0] || embeddedWallet
        let provider: any
        if (activeWallet) {
          try {
            await activeWallet.switchChain(activeChain.id)
          } catch { /* continue */ }
          provider = await activeWallet.getEthereumProvider()
        } else if (typeof window !== 'undefined' && (window as any).ethereum) {
          provider = (window as any).ethereum
        } else {
          throw new Error(launchJson?.error || 'No wallet provider available')
        }

        const { createWalletClient, custom, createPublicClient, http, parseEventLogs } = await import('viem')
        const walletClient = createWalletClient({
          chain: activeChain,
          transport: custom(provider),
        })
        const [account] = await walletClient.getAddresses()
        const userAddr = getAddress(account || address)

        const salt = generateRandomSalt()
        const launchConfigId = 0n
        const pairToken = zeroAddress
        const expectedEconomics = await getPreviewLaunchEconomics(launchConfigId, pairToken)
        const exactLaunchFee = await getLaunchFee()

        const tokenParams = {
          name: name.trim().slice(0, 32),
          symbol: symbol.trim().toUpperCase().slice(0, 10),
          logo: finalLogo,
          description: description.trim().slice(0, 280) || `${name} fair launched on Pons v2`,
          socials: {
            twitter: twitter.trim().slice(0, 100),
            telegram: telegram.trim().slice(0, 100),
            discord: discord.trim().slice(0, 100),
            website: website.trim().slice(0, 100),
            farcaster: farcaster.trim().slice(0, 100),
          },
          creatorFeeRecipient: userAddr,
          creatorTaxBps: Math.min(1000, Math.max(0, creatorTaxBps ?? 100)),
          buybackEnabled: !!buybackEnabled,
          expectedEconomics,
          salt,
        }

        const parsedExemptions: `0x${string}`[] = []
        if (extraExemptions.trim()) {
          const list = extraExemptions.split(',').map((s) => s.trim())
          for (const item of list) {
            if (isAddress(item)) parsedExemptions.push(getAddress(item))
          }
        }

        let txHash = ''
        if (initialBuyNum > 0) {
          toast('Confirm token launch & initial buy in your connected wallet...')
          const quoteIn = parseEther(initialBuyEth)
          const totalValue = exactLaunchFee + quoteIn

          txHash = await walletClient.writeContract({
            account,
            address: LAUNCH_AND_BUY_ROUTER,
            abi: LAUNCH_AND_BUY_ABI,
            functionName: 'launchAndBuy',
            args: [
              tokenParams,
              launchConfigId,
              pairToken,
              quoteIn,
              0n,
              userAddr,
              parsedExemptions,
            ],
            value: totalValue,
          })
        } else {
          toast('Confirm token launch in your connected wallet...')
          if (parsedExemptions.length > 0) {
            txHash = await walletClient.writeContract({
              account,
              address: PONS_V2_FACTORY,
              abi: FACTORY_ABI,
              functionName: 'launchToken',
              args: [tokenParams, launchConfigId, pairToken, parsedExemptions],
              value: exactLaunchFee,
            })
          } else {
            txHash = await walletClient.writeContract({
              account,
              address: PONS_V2_FACTORY,
              abi: FACTORY_ABI,
              functionName: 'launchToken',
              args: [tokenParams, launchConfigId, pairToken],
              value: exactLaunchFee,
            })
          }
        }

        toast('Waiting for on-chain confirmation...')
        const pubClient = createPublicClient({
          chain: activeChain,
          transport: http('https://robinhood-rpc.publicnode.com'),
        })

        const receipt = await pubClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`,
          retryCount: 30,
          timeout: 90_000,
        })

        try {
          const launchedEvents = parseEventLogs({
            abi: FACTORY_ABI,
            eventName: 'TokenLaunched',
            logs: receipt.logs,
          })
          if (launchedEvents.length > 0 && launchedEvents[0].args.token) {
            deployedTokenCa = getAddress(launchedEvents[0].args.token)
          }
        } catch { /* continue */ }

        if (!deployedTokenCa) {
          for (const log of receipt.logs) {
            if (
              log.topics &&
              log.topics.length >= 2 &&
              log.topics[0]?.toLowerCase() === '0x8d4aad4953d0ca700d468f3753aa14432d1b35b43ec6409f051fb6aa43a89607'.toLowerCase()
            ) {
              try {
                const raw = log.topics[1]
                if (raw && raw.length >= 26) {
                  const parsed = getAddress('0x' + raw.slice(26))
                  if (parsed !== zeroAddress) {
                    deployedTokenCa = parsed
                    break
                  }
                }
              } catch { /* continue */ }
            }
          }
        }
      }

      if (deployedTokenCa) {
        try {
          const { trackTokenAddress } = await import('@/hooks/useTokens')
          trackTokenAddress(address, deployedTokenCa)
          await fetch('/api/launchpad/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: deployedTokenCa }),
          })
        } catch { /* ignore */ }
      }

      toast.success(`Token $${symbol.toUpperCase()} successfully launched! Redirecting...`)
      await refetchBalance()

      if (deployedTokenCa) {
        window.location.href = `/token/${deployedTokenCa}`
      } else {
        window.location.href = '/coin'
      }
    } catch (err: unknown) {
      console.error('Token launch error:', err)
      const msg = err instanceof Error ? err.message : String(err)
      toast.error(`Launch failed: ${msg.slice(0, 110)}`)
    } finally {
      setDeploying(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-transparent">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#F5F5F7] animate-fadeIn">
      {/* Navigation */}
      <Navbar />

      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8">
          {/* Header Banner */}
          <div className="apple-glass p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="px-3 py-1 text-xs font-semibold bg-[#0A84FF]/15 text-[#0A84FF] border border-[#0A84FF]/30 rounded-full">
                Bonding Curve V2
              </span>
              <span className="px-3 py-1 text-xs font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-full">
                100% Fair Launch
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F7] tracking-tight">
              Launch Token on Robinhood Chain
            </h1>
            <p className="text-[#A1A1A6] text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Mint 1,000,000,000 fixed supply straight to the bonding curve. Zero dev pre-allocation, built-in anti-snipe tax shield, and automated graduation to Uniswap v4 locked liquidity.
            </p>
          </div>

          {/* Main 2-Column Split: Form (Left) & Interactive Preview (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left Column: Form */}
            <div className="lg:col-span-7 flex flex-col gap-5 apple-glass p-6 sm:p-7">
              <h2 className="text-sm font-semibold text-[#F5F5F7] pb-3 border-b border-white/[0.08]">
                Token Parameters
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#A1A1A6] mb-1.5 block">
                    Token Name <span className="text-[#0A84FF]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cyber Frog"
                    className="w-full apple-input px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A1A1A6] mb-1.5 block">
                    Symbol / Ticker <span className="text-[#0A84FF]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g. FROG"
                    className="w-full apple-input px-3.5 py-2.5 text-xs sm:text-sm text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl uppercase font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Direct Image File Upload */}
              <div>
                <label className="text-xs font-medium text-[#A1A1A6] mb-1.5 block">
                  Token Logo Image
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewLogo || logo ? (
                  <div className="flex items-center justify-between p-3 bg-white/[0.04] border border-white/[0.10] rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/[0.12] overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewLogo || logo}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#F5F5F7]">Logo Ready</p>
                        <p className="text-[11px] text-[#30D158] font-medium">Verified for deployment</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.08] transition-all cursor-pointer font-medium"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLogo('')
                          setPreviewLogo('')
                          committedLogoRef.current = ''
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 bg-white/[0.03] hover:bg-white/[0.06] border border-dashed border-white/[0.15] hover:border-white/[0.3] rounded-2xl cursor-pointer transition-all text-center group"
                  >
                    <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.10] group-hover:border-white/20 flex items-center justify-center text-[#A1A1A6] mb-2 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-[#F5F5F7] group-hover:text-white transition-colors">
                      Choose image file from device
                    </p>
                    <p className="text-[11px] text-[#6E6E73] mt-0.5">
                      PNG, JPG, WEBP, SVG, GIF (Or drag & drop)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-[#A1A1A6] mb-1.5 block">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your vision and tokenomics..."
                  className="w-full apple-input px-3.5 py-2.5 text-xs text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl resize-none"
                />
              </div>

              {/* Social Links */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#F5F5F7]">Social Links (Optional)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="Twitter / X (@handle)"
                    className="w-full apple-input px-3 py-2 text-xs text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="Telegram (t.me/...)"
                    className="w-full apple-input px-3 py-2 text-xs text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website (https://...)"
                    className="w-full apple-input px-3 py-2 text-xs text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                  <input
                    type="text"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                    placeholder="Discord invite URL"
                    className="w-full apple-input px-3 py-2 text-xs text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                </div>
              </div>

              {/* 1-Click Launch & Buy */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#F5F5F7] flex items-center gap-1.5">
                    <span>First Buy in Same Transaction</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 rounded-full font-medium">
                      Anti-Sniper Shield
                    </span>
                  </label>
                </div>
                <p className="text-[11px] text-[#A1A1A6]">
                  Buy tokens atomically during launch so front-running bots cannot snipe ahead of you.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={initialBuyEth}
                    onChange={(e) => setInitialBuyEth(e.target.value)}
                    placeholder="0.0 (Optional ETH amount)"
                    className="flex-1 apple-input px-3.5 py-2 text-xs font-mono text-[#F5F5F7] placeholder-[#6E6E73] rounded-xl"
                  />
                  <span className="text-xs font-semibold font-mono text-[#F5F5F7] bg-white/[0.08] px-3.5 py-2 rounded-xl border border-white/[0.10]">
                    ETH
                  </span>
                </div>
              </div>

              {/* Advanced Settings */}
              <button
                type="button"
                onClick={() => setShowAdvanced((p) => !p)}
                className="text-xs text-[#A1A1A6] hover:text-[#F5F5F7] flex items-center gap-1 transition-colors self-start cursor-pointer font-medium"
              >
                <span>{showAdvanced ? '▾ Hide Advanced' : '▸ Advanced Token Economics'}</span>
              </button>

              {showAdvanced && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3 animate-fadeIn">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-[#A1A1A6]">
                        Creator Tax: <span className="font-mono text-[#F5F5F7] font-semibold">{(creatorTaxBps / 100).toFixed(1)}%</span>
                      </label>
                      <span className="text-[11px] text-[#6E6E73]">Min 1.0% • Max 5.0%</span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="500"
                      step="10"
                      value={creatorTaxBps}
                      onChange={(e) => setCreatorTaxBps(Number(e.target.value))}
                      style={{ accentColor: '#0A84FF' }}
                      className="w-full cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Card Preview & Launch CTA */}
            <div className="lg:col-span-5 flex flex-col gap-5 lg:sticky lg:top-24">
              <div className="apple-glass p-5 sm:p-6 flex flex-col gap-4">
                <span className="text-xs font-semibold text-[#A1A1A6]">
                  Live Token Preview
                </span>

                {/* Token Preview Card */}
                <div className="bg-white/[0.04] border border-white/[0.10] rounded-2xl p-4 flex flex-col gap-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/[0.12] overflow-hidden relative flex-shrink-0 flex items-center justify-center shadow-sm">
                      {previewLogo || logo ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={previewLogo || logo}
                          alt={symbol || 'TOKEN'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-[#6E6E73]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm sm:text-base font-semibold text-[#F5F5F7]">
                          {name || 'Token Name'}
                        </span>
                        <span className="text-xs font-semibold text-[#0A84FF]">
                          ${symbol || 'TICKER'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#A1A1A6]">
                        1,000,000,000 Supply (100% Curve)
                      </span>
                    </div>
                  </div>

                  {description && (
                    <p className="text-xs text-[#A1A1A6] line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                  )}

                  <div className="bg-white/[0.03] border border-white/[0.08] p-3 rounded-xl flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between text-[#A1A1A6]">
                      <span>Graduation Target</span>
                      <span className="font-semibold text-[#F5F5F7]">5.0 ETH</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#30D158]"
                        style={{ width: '4%' }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6E6E73]">
                      <span>0.0 ETH Raised</span>
                      <span>Phase: Bonding Curve</span>
                    </div>
                  </div>
                </div>

                {/* Connected Wallet Status Card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F5F5F7]">Deployment Account</span>
                    {address ? (
                      <span className="text-[10px] font-medium bg-[#30D158]/15 text-[#30D158] px-2 py-0.5 rounded-full border border-[#30D158]/30">
                        Connected
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#6E6E73]">Not Connected</span>
                    )}
                  </div>

                  {address ? (
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.06]">
                        <span className="text-[#A1A1A6]">Wallet:</span>
                        <div className="flex items-center gap-1.5">
                          <code className="text-[#0A84FF] font-medium">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(address)
                              toast.success('Address copied!')
                            }}
                            className="text-[#A1A1A6] hover:text-[#F5F5F7] cursor-pointer p-0.5"
                            title="Copy Address"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl border border-white/[0.06]">
                        <span className="text-[#A1A1A6]">Balance:</span>
                        <span className="font-semibold text-[#F5F5F7]">
                          {ethBalance < 0.001 && ethBalance > 0
                            ? ethBalance.toFixed(6)
                            : ethBalance.toFixed(4)}{' '}
                          ETH
                        </span>
                      </div>

                      {!hasSufficientEth && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex flex-col gap-1 mt-1">
                          <span className="font-semibold text-amber-200">Balance Shortfall</span>
                          <p className="text-[#A1A1A6] text-xs">
                            Required: <strong className="font-mono text-white">{totalEthRequired.toFixed(4)} ETH</strong>. You have <strong className="font-mono text-amber-300">{ethBalance.toFixed(6)} ETH</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#A1A1A6]">
                      Connect your wallet to deploy on Robinhood Chain.
                    </p>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-2 text-xs text-[#A1A1A6]">
                  <div className="flex justify-between">
                    <span>Protocol Fee</span>
                    <span className="text-[#F5F5F7] font-medium">{launchFeeEth > 0 ? `${launchFeeEth} ETH` : '0 ETH'}</span>
                  </div>
                  {initialBuyNum > 0 && (
                    <div className="flex justify-between">
                      <span>Opening Buy</span>
                      <span className="font-medium text-[#0A84FF]">+{initialBuyNum.toFixed(4)} ETH</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-white/[0.08] text-[#F5F5F7] font-semibold text-sm">
                    <span>Total Required</span>
                    <span className="text-[#30D158] font-bold">{totalEthRequired.toFixed(4)} ETH</span>
                  </div>
                </div>

                {/* Launch Action */}
                {!isConnected ? (
                  <Button
                    variant="primary"
                    onClick={() => login()}
                    className="w-full py-3.5 text-xs font-semibold rounded-full"
                  >
                    <span>Connect Wallet to Deploy</span>
                  </Button>
                ) : !isFormValid ? (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full py-3.5 text-xs font-semibold rounded-full"
                  >
                    Enter Name & Symbol
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleLaunchToken}
                    loading={deploying || uploadingImage}
                    className="w-full py-3.5 text-xs font-semibold rounded-full"
                  >
                    {uploadingImage
                      ? 'Uploading Logo...'
                      : deploying
                      ? 'Deploying to Robinhood Chain...'
                      : `Deploy $${symbol.toUpperCase() || 'TOKEN'} on Curve`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ClaimFeesModal open={claimFeesOpen} onClose={() => setClaimFeesOpen(false)} />
    </div>
  )
}
