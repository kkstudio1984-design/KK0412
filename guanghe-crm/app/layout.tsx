import type { Metadata } from 'next'
import './globals.css'
import SideNav from '@/components/ui/SideNav'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: '光合創學空間營運 CRM',
  description: '空間客戶管理系統',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased bg-gray-50 min-h-screen">
        <div className="flex h-screen overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
