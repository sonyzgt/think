'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void
}

const defaultContext: SidebarContextType = {
  isOpen: false,
  setIsOpen: () => {},
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
}

const SidebarContext = createContext<SidebarContextType>(defaultContext)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Default open on desktop, closed on mobile
  const [isOpen, setIsOpen] = useState(false)

  // On initial mount check screen width
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false)
    }
  }, [])

  // Auto close on route change for mobile screens only
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsOpen(false)
    }
  }, [pathname])

  const toggleSidebar = () => setIsOpen((prev) => !prev)
  const closeSidebar = () => setIsOpen(false)
  const openSidebar = () => setIsOpen(true)

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleSidebar,
        closeSidebar,
        openSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  return context || defaultContext
}
