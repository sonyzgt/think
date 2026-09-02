'use client'

import { useEffect, ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 md:pt-20 p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      {/* Apple Liquid Glass Modal Panel */}
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl apple-glass p-6 overflow-hidden animate-fadeIn select-none shadow-2xl"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.6)]" />
            <h2 className="text-base font-semibold tracking-tight text-[#F5F5F7]">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A1A6] hover:text-[#F5F5F7] p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] transition-all cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
