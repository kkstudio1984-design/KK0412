import type { Metadata } from 'next'
import { Inter, Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import PWARegister from '@/components/ui/PWARegister'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
})

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '光合創學營運管理系統',
  description: 'Guanghe OMS — 六大模組整合營運後台',
  manifest: '/manifest.json',
  themeColor: '#d97706',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
    apple: '/icon-192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '光合 OMS',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} ${notoSansTC.variable} ${notoSerifTC.variable} font-sans antialiased min-h-screen`} style={{ background: '#0a0a0a' }}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c1917',
              color: '#fafaf9',
              borderRadius: '12px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            },
            success: {
              iconTheme: { primary: '#d97706', secondary: '#fafaf9' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fafaf9' },
            },
          }}
        />
        <Analytics />
        <SpeedInsights />
        <PWARegister />
      </body>
    </html>
  )
}
