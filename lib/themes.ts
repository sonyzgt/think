export interface ThemeConfig {
  id: string
  name: string
  color: string // Hex code for swatch
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
    name: 'Apple Silver',
    color: '#f5f5f7',
    primary: '#f5f5f7',
    primaryHover: '#ffffff',
    secondary: '#86868b',
    glow: 'rgba(255, 255, 255, 0.45)',
    ringColor: 'ring-white',
    borderAccent: 'rgba(255, 255, 255, 0.35)',
  },
  {
    id: 'apple_blue',
    name: 'Cupertino Blue',
    color: '#0071e3',
    primary: '#0071e3',
    primaryHover: '#2997ff',
    secondary: '#0056b3',
    glow: 'rgba(0, 113, 227, 0.45)',
    ringColor: 'ring-blue-500',
    borderAccent: 'rgba(0, 113, 227, 0.35)',
  },
  {
    id: 'space_gray',
    name: 'Space Gray',
    color: '#8e8e93',
    primary: '#8e8e93',
    primaryHover: '#aeaeb2',
    secondary: '#636366',
    glow: 'rgba(142, 142, 147, 0.4)',
    ringColor: 'ring-zinc-400',
    borderAccent: 'rgba(142, 142, 147, 0.35)',
  },
  {
    id: 'apple_purple',
    name: 'Deep Purple',
    color: '#af52de',
    primary: '#af52de',
    primaryHover: '#bf5af2',
    secondary: '#8944ab',
    glow: 'rgba(175, 82, 222, 0.45)',
    ringColor: 'ring-purple-400',
    borderAccent: 'rgba(175, 82, 222, 0.35)',
  },
  {
    id: 'apple_mint',
    name: 'Apple Mint',
    color: '#30d158',
    primary: '#30d158',
    primaryHover: '#34c759',
    secondary: '#248a3d',
    glow: 'rgba(48, 209, 88, 0.45)',
    ringColor: 'ring-emerald-400',
    borderAccent: 'rgba(48, 209, 88, 0.35)',
  },
  {
    id: 'apple_orange',
    name: 'Ultra Orange',
    color: '#ff9f0a',
    primary: '#ff9f0a',
    primaryHover: '#ffb340',
    secondary: '#c97800',
    glow: 'rgba(255, 159, 10, 0.45)',
    ringColor: 'ring-amber-400',
    borderAccent: 'rgba(255, 159, 10, 0.35)',
  },
]
