'use client'

import { useTheme } from '@/context/ThemeContext'
import SparkleIcon from '@/components/ui/SparkleIcon'

export default function Footer() {
  const { theme } = useTheme()

  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#050506]/60 backdrop-blur-2xl mt-auto select-none">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Left: Copyright & Network */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[#A1A1A6]">
          <div className="flex items-center gap-2">
            <SparkleIcon size={20} className="flex-shrink-0 text-[#0A84FF]" />
            <span className="font-semibold text-[#F5F5F7]">
              APOLLO
            </span>
            <span className="text-[#6E6E73] text-[11px]">© 2026</span>
          </div>
          <span className="hidden sm:inline text-white/10">|</span>
          <div className="flex items-center gap-2 text-[#A1A1A6]">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: theme.color }}
            />
            <span className="text-xs font-medium">Robinhood Chain (ID: 4663)</span>
          </div>
        </div>

        {/* Right: Social & Community Links */}
        <div className="flex items-center gap-3 text-[#A1A1A6]">
          <a
            href="https://x.com/apollo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[#F5F5F7] hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-full border border-white/[0.08] transition-all font-medium text-xs shadow-sm active:scale-95"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>@apollo</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
