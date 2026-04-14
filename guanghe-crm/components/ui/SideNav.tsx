'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'CRM 看板', color: '#d97706' },
  { href: '/projects', label: '專案管理', color: '#7c3aed' },
  { href: '/sales', label: '銷售管線', color: '#0ea5e9' },
  { href: '/sales/sponsorships', label: 'ESG 贊助', color: '#0ea5e9' },
  { href: '/finance', label: '財務總覽', color: '#10b981' },
  { href: '/training', label: '教育訓練', color: '#ec4899' },
  { href: '/ai-strategy', label: 'AI 戰略', color: '#8b5cf6' },
  { href: '/dashboard', label: '儀表板', color: '#9a9a9a' },
  { href: '/address-risk', label: '地址風險', color: '#d97706' },
]

interface Props {
  onNavigate?: () => void
}

export default function SideNav({ onNavigate }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email || '')
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        if (profile) setUserRole(profile.role)
      }
    })
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel: Record<string, string> = {
    admin: '管理員',
    operator: '行政人員',
    viewer: '股東',
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 h-full" style={{ background: '#0d0d0d' }}>
      {/* Brand */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#0a0a0a' }}>
            光
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.15em] uppercase" style={{ color: '#555' }}>GUANGHE</p>
            <p className="text-sm font-semibold text-white leading-tight">營運管理系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : item.href === '/sales'
                ? pathname === '/sales' || (pathname.startsWith('/sales') && !pathname.startsWith('/sales/sponsorships'))
                : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: isActive ? '#fff' : '#777',
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.color, opacity: isActive ? 1 : 0.4 }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid #1a1a1a' }}>
        {userName && (
          <div className="mb-3">
            <p className="text-sm text-white font-medium truncate">{userName}</p>
            {userRole && (
              <p className="text-xs mt-0.5" style={{ color: '#555' }}>{roleLabel[userRole] || userRole}</p>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs font-medium hover:text-white"
          style={{ color: '#555' }}
        >
          登出 →
        </button>
      </div>
    </aside>
  )
}
