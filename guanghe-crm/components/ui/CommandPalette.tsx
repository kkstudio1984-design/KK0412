'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  name: string
  subtitle: string
  href: string
}

interface SearchResponse {
  clients: SearchResult[]
  leads: SearchResult[]
  projects: SearchResult[]
}

const QUICK_PAGES = [
  { name: 'CRM 看板', href: '/', icon: '⊞', group: '頁面' },
  { name: '新增客戶', href: '/clients/new', icon: '＋', group: '頁面' },
  { name: '銷售管線', href: '/sales', icon: '◎', group: '頁面' },
  { name: '新增潛在客戶', href: '/sales/leads/new', icon: '＋', group: '頁面' },
  { name: 'ESG 贊助', href: '/sales/sponsorships', icon: '♻', group: '頁面' },
  { name: '專案管理', href: '/projects', icon: '▦', group: '頁面' },
  { name: '財務總覽', href: '/finance', icon: '¥', group: '頁面' },
  { name: '教育訓練', href: '/training', icon: '◉', group: '頁面' },
  { name: 'AI 戰略', href: '/ai-strategy', icon: '⚡', group: '頁面' },
  { name: '儀表板', href: '/dashboard', icon: '◈', group: '頁面' },
  { name: '月報表', href: '/reports', icon: '📊', group: '頁面' },
  { name: '地址風險', href: '/address-risk', icon: '⚠', group: '頁面' },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse>({ clients: [], leads: [], projects: [] })
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelectedIndex(0)
    } else {
      setQuery('')
      setResults({ clients: [], leads: [], projects: [] })
    }
  }, [open])

  // Fetch search results
  useEffect(() => {
    if (!query.trim()) {
      setResults({ clients: [], leads: [], projects: [] })
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults({
            clients: data.clients || [],
            leads: data.leads || [],
            projects: data.projects || [],
          })
        }
      } catch {} finally {
        setLoading(false)
      }
    }, 200)
  }, [query])

  // Build unified flat list
  const filteredPages = query.trim()
    ? QUICK_PAGES.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : QUICK_PAGES

  const allItems: Array<{ label: string; items: Array<SearchResult | { name: string; href: string; subtitle?: string; icon?: string }> }> = []
  if (results.clients.length) allItems.push({ label: '客戶', items: results.clients })
  if (results.leads.length) allItems.push({ label: '潛在客戶', items: results.leads })
  if (results.projects.length) allItems.push({ label: '專案', items: results.projects })
  if (filteredPages.length) allItems.push({ label: '頁面', items: filteredPages })

  const flatItems = allItems.flatMap((g) => g.items)

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatItems[selectedIndex]
        if (item) {
          setOpen(false)
          router.push(item.href)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, flatItems, selectedIndex, router])

  if (!open) return null

  let itemIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl overflow-hidden"
        style={{ background: '#111', border: '1px solid #333', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(217,119,6,0.1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #222' }}>
          <svg className="w-5 h-5 shrink-0" style={{ color: '#666' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋客戶、潛在客戶、專案、頁面..."
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#555]"
          />
          {loading && <span className="text-xs" style={{ color: '#666' }}>搜尋中...</span>}
          <kbd className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#1a1a1a', color: '#666', border: '1px solid #333' }}>
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm" style={{ color: '#666' }}>
                {query ? '找不到結果' : '輸入關鍵字開始搜尋'}
              </p>
              {!query && (
                <p className="text-xs mt-2" style={{ color: '#444' }}>
                  <kbd className="px-1 font-mono">↑↓</kbd> 選取 ·
                  <kbd className="px-1 font-mono"> Enter</kbd> 開啟 ·
                  <kbd className="px-1 font-mono"> ESC</kbd> 關閉
                </p>
              )}
            </div>
          ) : (
            allItems.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#555' }}>
                  {group.label}
                </p>
                {group.items.map((item) => {
                  itemIndex++
                  const isSelected = itemIndex === selectedIndex
                  const itemAny = item as SearchResult & { icon?: string }
                  return (
                    <button
                      key={`${group.label}-${itemAny.href}`}
                      onClick={() => {
                        setOpen(false)
                        router.push(itemAny.href)
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                      style={{
                        background: isSelected ? 'rgba(217,119,6,0.1)' : 'transparent',
                        borderLeft: isSelected ? '2px solid #d97706' : '2px solid transparent',
                      }}
                    >
                      {itemAny.icon && <span className="text-base w-5 text-center opacity-70">{itemAny.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{itemAny.name}</p>
                        {itemAny.subtitle && <p className="text-xs truncate" style={{ color: '#777' }}>{itemAny.subtitle}</p>}
                      </div>
                      {isSelected && (
                        <kbd className="text-xs px-1.5 py-0.5 rounded font-mono shrink-0" style={{ background: '#222', color: '#aaa', border: '1px solid #333' }}>
                          ↵
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
