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
    id: 'chrome',
    name: 'Liquid Chrome',
    color: '#e2e8f0',
    primary: '#e2e8f0',
    primaryHover: '#ffffff',
    secondary: '#94a3b8',
    glow: 'rgba(255, 255, 255, 0.55)',
    ringColor: 'ring-slate-200',
    borderAccent: 'rgba(255, 255, 255, 0.5)',
  },
  {
    id: 'silver',
    name: 'Titanium Silver',
    color: '#cbd5e1',
    primary: '#cbd5e1',
    primaryHover: '#f1f5f9',
    secondary: '#64748b',
    glow: 'rgba(203, 213, 225, 0.5)',
    ringColor: 'ring-slate-300',
    borderAccent: 'rgba(203, 213, 225, 0.45)',
  },
  {
    id: 'platinum',
    name: 'Mirror Platinum',
    color: '#ffffff',
    primary: '#ffffff',
    primaryHover: '#f8fafc',
    secondary: '#a1a1aa',
    glow: 'rgba(255, 255, 255, 0.65)',
    ringColor: 'ring-white',
    borderAccent: 'rgba(255, 255, 255, 0.6)',
  },
  {
    id: 'steel',
    name: 'Brushed Steel',
    color: '#94a3b8',
    primary: '#94a3b8',
    primaryHover: '#cbd5e1',
    secondary: '#475569',
    glow: 'rgba(148, 163, 184, 0.45)',
    ringColor: 'ring-slate-400',
    borderAccent: 'rgba(148, 163, 184, 0.4)',
  },
  {
    id: 'cyber_chrome',
    name: 'Cyber Chrome',
    color: '#38bdf8',
    primary: '#38bdf8',
    primaryHover: '#7dd3fc',
    secondary: '#0284c7',
    glow: 'rgba(56, 189, 248, 0.45)',
    ringColor: 'ring-sky-400',
    borderAccent: 'rgba(56, 189, 248, 0.4)',
  },
  {
    id: 'emerald',
    name: 'Emerald Matrix',
    color: '#10b981',
    primary: '#10b981',
    primaryHover: '#34d399',
    secondary: '#059669',
    glow: 'rgba(16, 185, 129, 0.45)',
    ringColor: 'ring-emerald-400',
    borderAccent: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'gold_chrome',
    name: 'Chrome Gold',
    color: '#fbbf24',
    primary: '#fbbf24',
    primaryHover: '#fef08a',
    secondary: '#d97706',
    glow: 'rgba(251, 191, 36, 0.45)',
    ringColor: 'ring-amber-400',
    borderAccent: 'rgba(251, 191, 36, 0.4)',
  },
]
