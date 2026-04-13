import type { Metadata } from 'next'
import { Inter, Noto_Sans_TC } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

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

export const metadata: Metadata = {
  title: '光合創學營運管理系統',
  description: 'Guanghe OMS',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} ${notoSansTC.variable} font-sans antialiased bg-stone-50 min-h-screen`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
