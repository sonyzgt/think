import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import ClientProviders from '@/components/ClientProviders'
import SparkleBackground from '@/components/ui/SparkleBackground'

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
  themeColor: '#050506',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://atlas.world'),
  title: 'ATLAS — World Country Token Map on Robinhood Chain',
  description: 'ATLAS — Geographical World Country Token Map and Fair Launchpad on Robinhood Chain.',
  icons: {
    icon: [
      { url: '/sparkle-logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/sparkle-logo.svg',
    apple: '/sparkle-logo.svg',
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-[#050506] text-[#F5F5F7] antialiased selection:bg-[#0A84FF]/25 selection:text-white relative overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Ambient Apple Vision Liquid Glass Ambient Backdrop */}
        <SparkleBackground />

        {/* App Content */}
        <div className="relative z-10 flex flex-col flex-1" suppressHydrationWarning>
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  )
}