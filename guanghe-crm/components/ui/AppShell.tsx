'use client'

import { useState } from 'react'
import SideNav from './SideNav'
import NotificationBell from './NotificationBell'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <SideNav />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-56 h-full">
            <SideNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-white p-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#0a0a0a' }}>光</div>
              <span className="text-sm font-semibold text-white">光合創學</span>
            </div>
          </div>
          <NotificationBell />
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-end gap-1 px-4 py-2" style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a' }}>
          <NotificationBell />
        </div>

        <main className="flex-1 overflow-auto" style={{ background: '#0a0a0a' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
