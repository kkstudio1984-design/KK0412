'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'CRM 看板', icon: '⊞' },
  { href: '/projects', label: '專案管理', icon: '▦' },
  { href: '/sales', label: '銷售管線', icon: '◎' },
  { href: '/sales/sponsorships', label: 'ESG 贊助', icon: '♻' },
  { href: '/finance', label: '財務總覽', icon: '¥' },
  { href: '/training', label: '教育訓練', icon: '◉' },
  { href: '/ai-strategy', label: 'AI 戰略', icon: '⚡' },
  { href: '/dashboard', label: '儀表板', icon: '◈' },
  { href: '/address-risk', label: '地址風險', icon: '⚠' },
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

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    operator: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    viewer: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  }

  return (
    <aside className="w-56 bg-slate-900 flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg shadow-amber-500/20">
            光
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium tracking-[0.15em] uppercase">Guanghe</p>
            <p className="text-sm font-semibold text-white leading-tight">營運管理系統</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/sales'
                ? pathname === '/sales' || (pathname.startsWith('/sales') && !pathname.startsWith('/sales/sponsorships'))
                : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                isActive
                  ? 'bg-white/[0.08] text-amber-400 font-semibold'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none opacity-70">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        {userName && (
          <div className="mb-3">
            <p className="text-sm text-slate-300 font-medium truncate">{userName}</p>
            {userRole && (
              <span className={`inline-block mt-1 text-xs font-semibold px-1.5 py-0.5 rounded border ${roleBadgeColor[userRole] || 'text-slate-400'}`}>
                {roleLabel[userRole] || userRole}
              </span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-slate-300 font-medium"
        >
          登出 →
        </button>
      </div>
    </aside>
  )
}
