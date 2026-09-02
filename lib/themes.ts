export interface ThemeConfig {
  id: string
  name: string
  color: string
  primary: string
  primaryHover: string
  secondary: string
  glow: string
  ringColor: string
  borderAccent: string
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'apple_silver',
    name: 'Apple White',
    color: '#ffffff',
    primary: '#ffffff',
    primaryHover: '#f5f5f7',
    secondary: '#a1a1a6',
    glow: 'rgba(255, 255, 255, 0.45)',
    ringColor: 'ring-white',
    borderAccent: 'rgba(255, 255, 255, 0.35)',
  },
]
