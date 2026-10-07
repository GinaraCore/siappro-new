// ============================================================
// SIAP-Pro: Root App Layout
// Dewan Ekonomi Nasional Republik Indonesia
// ============================================================

import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'SIAP-Pro: Dewan Ekonomi Nasional RI',
    template: '%s | SIAP-Pro DEN RI',
  },
  description:
    'Sistem Informasi dan Aplikasi Protokoler resmi Dewan Ekonomi Nasional Republik Indonesia. Platform operasional dan manajemen kegiatan protokoler kenegaraan.',
  keywords: ['protokol', 'DEN', 'Dewan Ekonomi Nasional', 'SIAP-Pro', 'laporan kegiatan', 'protokoler presiden'],
  authors: [{ name: 'Dewan Ekonomi Nasional RI' }],
  robots: 'noindex, nofollow', // Aplikasi internal kedinasan: tanpa pengindeksan publik
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  )
}
