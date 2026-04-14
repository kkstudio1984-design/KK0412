'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'CRM 看板', icon: '⊞', color: '#d97706' },
  { href: '/projects', label: '專案管理', icon: '▦', color: '#7c3aed' },
  { href: '/sales', label: '銷售管線', icon: '◎', color: '#0ea5e9' },
  { href: '/sales/sponsorships', label: 'ESG 贊助', icon: '♻', color: '#0ea5e9' },
  { href: '/finance', label: '財務總覽', icon: '¥', color: '#10b981' },
  { href: '/training', label: '教育訓練', icon: '◉', color: '#ec4899' },
  { href: '/ai-strategy', label: 'AI 戰略', icon: '⚡', color: '#8b5cf6' },
  { href: '/dashboard', label: '儀表板', icon: '◈', color: '#d97706' },
  { href: '/address-risk', label: '地址風險', icon: '⚠', color: '#d97706' },
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

  const roleBadge: Record<string, string> = {
    admin: 'rgba(217, 119, 6, 0.15)',
    operator: 'rgba(14, 165, 233, 0.15)',
    viewer: 'rgba(139, 92, 246, 0.15)',
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 h-full" style={{ background: '#0d0d0d', borderRight: '1px solid #1a1a1a' }}>
      {/* Brand with glow */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#0a0a0a',
              boxShadow: '0 0 20px rgba(217, 119, 6, 0.3), 0 0 60px rgba(217, 119, 6, 0.1)',
            }}
          >
            光
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight" style={{ textShadow: '0 0 30px rgba(217, 119, 6, 0.2)' }}>
              光合創學
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>營運管理系統</p>
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
                background: isActive ? `${item.color}11` : 'transparent',
                color: isActive ? '#fff' : '#888',
                borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                boxShadow: isActive ? `inset 0 0 20px ${item.color}08` : 'none',
              }}
            >
              <span className="text-base leading-none opacity-60">{item.icon}</span>
              <span style={{ textShadow: isActive ? `0 0 20px ${item.color}40` : 'none' }}>{item.label}</span>
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
              <span
                className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded"
                style={{
                  background: roleBadge[userRole] || 'rgba(255,255,255,0.05)',
                  color: userRole === 'admin' ? '#fbbf24' : userRole === 'operator' ? '#38bdf8' : '#c4b5fd',
                  border: `1px solid ${userRole === 'admin' ? 'rgba(217,119,6,0.2)' : userRole === 'operator' ? 'rgba(14,165,233,0.2)' : 'rgba(139,92,246,0.2)'}`,
                }}
              >
                {roleLabel[userRole] || userRole}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs font-medium"
          style={{ color: '#666' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#666')}
        >
          登出 →
        </button>
      </div>
    </aside>
  )
}
