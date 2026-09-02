'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'
import Button from './ui/Button'

export default function LoginButton() {
  const { authenticated, login } = usePrivy()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (authenticated && typeof window !== 'undefined' && window.location.pathname !== '/dashboard') {
      window.location.replace('/dashboard')
    }
  }, [authenticated])

  const handleWallet = () => {
    setLoading(true)
    try {
      login()
    } catch {
      // fallback
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 w-full font-mono">
      {/* Direct Web3 Wallet Connection Only */}
      <Button
        size="lg"
        loading={loading}
        onClick={handleWallet}
        className="w-full gap-3 bg-[#FF6A00] hover:bg-[#FF7A00] border-2 border-white text-white shadow-[4px_4px_0px_0px_#000000] text-sm sm:text-base font-black uppercase tracking-wider"
      >
        {!loading && (
          <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current" aria-hidden>
            <path d="M6.552 10.759c5.21-5.096 13.664-5.096 18.874 0l.627.613a.643.643 0 0 1 0 .923l-2.144 2.096a.339.339 0 0 1-.472 0l-.863-.844c-3.636-3.556-9.531-3.556-13.167 0l-.924.903a.339.339 0 0 1-.472 0L5.867 12.354a.643.643 0 0 1 0-.923l.685-.672Zm23.301 4.34 1.908 1.866a.643.643 0 0 1 0 .922l-8.603 8.415a.678.678 0 0 1-.944 0l-6.105-5.972a.17.17 0 0 0-.236 0l-6.105 5.972a.678.678 0 0 1-.944 0L.221 17.887a.643.643 0 0 1 0-.922l1.908-1.866a.678.678 0 0 1 .944 0l6.105 5.972a.17.17 0 0 0 .236 0l6.105-5.972a.678.678 0 0 1 .944 0l6.105 5.972a.17.17 0 0 0 .236 0l6.105-5.972a.678.678 0 0 1 .944 0Z" />
          </svg>
        )}
        CONNECT WALLET
      </Button>
    </div>
  )
}
