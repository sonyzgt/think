'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSidebar()

  return (
    <div className="min-h-screen flex flex-row bg-[#050807] text-zinc-100 antialiased relative overflow-x-hidden">
      {/* 1. Left Sidebar (Fixed / Off-canvas drawer) */}
      <Sidebar />

      {/* 2. Main Content Area smoothly adjusting full width when closed */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ease-in-out ${
          isOpen ? 'md:pl-64' : 'pl-0'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
