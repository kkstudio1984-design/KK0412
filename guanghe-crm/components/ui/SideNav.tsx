'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'CRM 看板', icon: '◉' },
  { href: '/dashboard', label: '儀表板', icon: '▦' },
]

export default function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="w-48 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-gray-200">
        <p className="text-xs text-gray-400 font-medium">光合創學</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5">空間營運 CRM</p>
      </div>
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
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
