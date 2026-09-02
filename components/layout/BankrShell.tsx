'use client'

import React, { useState, useRef } from 'react'
import Sidebar from './Sidebar'
import BankrChatView from '@/components/chat/BankrChatView'

export default function BankrShell() {
  const [collapsed, setCollapsed] = useState(false)
  const newChatRef = useRef<(() => void) | null>(null)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090b] text-zinc-100 font-sans select-none">
      {/* Left Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onNewChat={() => newChatRef.current?.()}
      />

      {/* Center Chat Workstation */}
      <BankrChatView onNewChatRef={newChatRef} />
    </div>
  )
}
