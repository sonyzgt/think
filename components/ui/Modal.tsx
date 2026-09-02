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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Dark Command Center Modal Panel */}
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-[#0B0E12] border border-[#292F36] p-5 overflow-hidden animate-fadeIn select-none shadow-2xl text-[#F5F5F5]"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-[#20252B] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#FF6A00] shadow-[0_0_8px_rgba(255,106,0,0.8)]" />
            <h2 className="text-sm font-bold tracking-tight text-[#F5F5F5] font-mono">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B929A] hover:text-[#F5F5F5] p-1.5 rounded-lg bg-[#15191E] hover:bg-[#1C2229] border border-[#343A41] transition-all cursor-pointer active:scale-95 text-xs font-bold"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
