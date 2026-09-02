'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium tracking-tight rounded-full select-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none cursor-pointer active:scale-[0.98]'

  const variants = {
    primary:
      'bg-[#0A84FF] hover:bg-[#2492FF] text-white shadow-[0_2px_12px_rgba(10,132,255,0.4)] border border-[#0A84FF]/40',
    secondary:
      'bg-white/[0.06] hover:bg-white/[0.12] text-[#F5F5F7] border border-white/[0.10] shadow-sm',
    ghost:
      'bg-transparent hover:bg-white/[0.08] text-[#A1A1A6] hover:text-[#F5F5F7] border border-transparent transition-colors',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_2px_12px_rgba(244,63,94,0.4)] border border-rose-500/40',
    accent:
      'bg-[#30D158] hover:bg-[#3be065] text-black shadow-[0_2px_12px_rgba(48,209,88,0.4)] border border-[#30D158]/40 font-semibold',
  }

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-xs sm:text-sm',
    lg: 'px-7 py-3.5 text-sm sm:text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
