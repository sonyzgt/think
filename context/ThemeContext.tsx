'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { THEMES, ThemeConfig } from '@/lib/themes'

interface ThemeContextType {
  theme: ThemeConfig
  setThemeId: (id: string) => void
  themes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  setThemeId: () => {},
  themes: THEMES,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const currentTheme = THEMES[0]

  const applyThemeVars = (t: ThemeConfig) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.setAttribute('data-theme', t.id)
    root.style.setProperty('--accent', t.primary)
    root.style.setProperty('--accent-hover', t.primaryHover)
    root.style.setProperty('--theme-color', t.primary)
    root.style.setProperty('--theme-light', t.color)
    root.style.setProperty('--theme-dark', t.secondary)
    root.style.setProperty('--theme-glow', t.glow)
    root.style.setProperty('--theme-subtle', `${t.primary}25`)
    root.style.setProperty('--theme-border', `${t.primary}55`)
  }

  const setThemeId = () => {
    applyThemeVars(currentTheme)
  }

  useEffect(() => {
    applyThemeVars(currentTheme)
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setThemeId, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
