'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'CRM 看板', icon: '⊞' },
  { href: '/dashboard', label: '儀表板', icon: '◈' },
]

export default function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="w-52 bg-slate-900 flex flex-col shrink-0 shadow-xl">
      {/* Brand Header */}
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg shadow-amber-900/30">
            光
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Guanghe</p>
            <p className="text-sm font-semibold text-white leading-tight">空間營運 CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-600 font-medium tracking-wide">光合創學空間</p>
      </div>
    </aside>
  )
}
