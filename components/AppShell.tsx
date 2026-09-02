'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { useSidebar } from '@/context/SidebarContext'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen flex flex-row bg-[#050807] text-zinc-100 antialiased relative">
      {/* 1. Left Sidebar (Fixed on Desktop, Drawer on Mobile) */}
      <Sidebar />

      {/* 2. Main Content Area adjusted for Left Sidebar Width */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
