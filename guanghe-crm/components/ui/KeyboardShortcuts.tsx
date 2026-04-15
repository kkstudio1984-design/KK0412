'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: '全域搜尋', desc: '快速跳轉到任何客戶/專案/頁面' },
  { keys: ['?'], label: '開啟此說明', desc: '顯示所有快捷鍵' },
  { keys: ['g', 'h'], label: '首頁', desc: 'CRM 看板' },
  { keys: ['g', 'd'], label: '儀表板', desc: '三層儀表板' },
  { keys: ['g', 's'], label: '銷售', desc: '銷售管線' },
  { keys: ['g', 'p'], label: '專案', desc: '專案管理' },
  { keys: ['g', 'f'], label: '財務', desc: '財務總覽' },
  { keys: ['g', 'r'], label: '報表', desc: '月報表' },
  { keys: ['g', 'c'], label: '日曆', desc: '日曆檢視' },
  { keys: ['g', 'v'], label: '訪客', desc: '訪客登記' },
  { keys: ['g', 't'], label: '教育訓練', desc: '教育訓練' },
  { keys: ['n', 'c'], label: '新增客戶', desc: '快速新增客戶' },
  { keys: ['n', 'l'], label: '新增 Lead', desc: '快速新增潛在客戶' },
  { keys: ['n', 'v'], label: '新增訪客', desc: '訪客登記頁' },
  { keys: ['ESC'], label: '關閉彈窗', desc: '關閉 modal 或返回' },
]

export default function KeyboardShortcuts() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [pendingTimer, setPendingTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') target.blur()
        return
      }
      // Skip if modifier keys other than shift (leave Cmd+K alone - handled by CommandPalette)
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // ? opens help
      if (e.key === '?') {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }

      // ESC closes help
      if (e.key === 'Escape' && open) {
        setOpen(false)
        return
      }

      // Two-key combos (g+x, n+x)
      if (pendingKey === null) {
        if (e.key === 'g' || e.key === 'n') {
          e.preventDefault()
          setPendingKey(e.key)
          if (pendingTimer) clearTimeout(pendingTimer)
          const timer = setTimeout(() => setPendingKey(null), 1000)
          setPendingTimer(timer)
        }
      } else if (pendingKey === 'g') {
        e.preventDefault()
        const routes: Record<string, string> = {
          h: '/',
          d: '/dashboard',
          s: '/sales',
          p: '/projects',
          f: '/finance',
          r: '/reports',
          c: '/calendar',
          v: '/visitors',
          t: '/training',
        }
        if (routes[e.key]) router.push(routes[e.key])
        setPendingKey(null)
        if (pendingTimer) clearTimeout(pendingTimer)
      } else if (pendingKey === 'n') {
        e.preventDefault()
        const routes: Record<string, string> = {
          c: '/clients/new',
          l: '/sales/leads/new',
          v: '/visitors',
        }
        if (routes[e.key]) router.push(routes[e.key])
        setPendingKey(null)
        if (pendingTimer) clearTimeout(pendingTimer)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pendingKey, pendingTimer, open, router])

  return (
    <>
      {/* Pending hint */}
      {pendingKey && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm"
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#fbbf24',
            boxShadow: '0 0 20px rgba(217,119,6,0.2)',
          }}
        >
          <kbd className="font-mono">{pendingKey}</kbd>
          <span className="mx-2" style={{ color: '#666' }}>→</span>
          <span>等待下一個按鍵...</span>
        </div>
      )}

      {/* Help modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div
            className="rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            style={{ background: '#111', border: '1px solid #333', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(217,119,6,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #222' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-display">鍵盤快捷鍵</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#888' }}>按 ? 隨時開啟此說明</p>
                </div>
                <kbd className="text-xs px-2 py-1 rounded font-mono" style={{ background: '#1a1a1a', color: '#666', border: '1px solid #333' }}>ESC</kbd>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-1">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < SHORTCUTS.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                  <div>
                    <p className="text-sm text-white">{s.label}</p>
                    <p className="text-xs" style={{ color: '#666' }}>{s.desc}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {s.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="text-xs px-2 py-1 rounded font-mono min-w-[24px] text-center"
                        style={{ background: '#1a1a1a', color: '#fbbf24', border: '1px solid #2a2a2a' }}
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3" style={{ borderTop: '1px solid #222', background: '#0a0a0a' }}>
              <p className="text-xs" style={{ color: '#888' }}>
                💡 兩段式快捷鍵（如 <kbd className="font-mono px-1">g</kbd> <kbd className="font-mono px-1">h</kbd>）需要在 1 秒內依序按下
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
