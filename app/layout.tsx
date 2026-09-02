import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import SparkleBackground from '@/components/ui/SparkleBackground'
import EarthCursor from '@/components/ui/EarthCursor'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas.world'),
  title: 'ATLAS — World Country Token Map on Robinhood Chain',
  description: 'ATLAS — Geographical World Country Token Map and Fair Launchpad on Robinhood Chain.',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-white text-[#111111] antialiased selection:bg-[#FF6A00]/25 selection:text-[#111111] relative overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Desktop Custom Earth Globe Cursor */}
        <EarthCursor />

        {/* Ambient Clean Backdrop */}
        <SparkleBackground />

        {/* App Content */}
        <div className="relative z-10 flex flex-col flex-1 bg-white" suppressHydrationWarning>
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  )
}