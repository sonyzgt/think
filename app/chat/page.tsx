'use client'

export const dynamic = 'force-dynamic'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AiChatWidget from '@/components/chat/AiChatWidget'
import SparkleIcon from '@/components/ui/SparkleIcon'

export default function ChatPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent text-[#F5F5F7] animate-fadeIn">
      {/* Navigation */}
      <Navbar />

      {/* Main Terminal Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* Apple Intelligence Title Banner */}
        <div className="apple-glass p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/[0.06] border border-white/[0.12] rounded-2xl shadow-sm flex-shrink-0">
              <SparkleIcon size={26} className="text-[#0A84FF]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-[#F5F5F7] tracking-tight">
                  PONSTHINK AI Trading Assistant
                </h1>
                <span className="text-[11px] font-semibold bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30 px-2.5 py-0.5 rounded-full shadow-sm">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#A1A1A6] mt-1">
                Execute intelligent token swaps, check holdings, snipe new pairs, and deploy contracts via natural language.
              </p>
            </div>
          </div>

          {/* Quick Examples Pills */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[#6E6E73] font-medium text-[11px]">Suggestions:</span>
            <span className="bg-white/[0.06] text-[#A1A1A6] border border-white/[0.08] px-2.5 py-1 rounded-full">
              buy 10$ 0x...
            </span>
            <span className="bg-white/[0.06] text-[#A1A1A6] border border-white/[0.08] px-2.5 py-1 rounded-full">
              swap all 0x...
            </span>
          </div>
        </div>

        {/* AI Chat Widget */}
        <div className="w-full flex-1 flex flex-col">
          <AiChatWidget fullScreen={true} />
        </div>
      </main>

      <Footer />
    </div>
  )
}
