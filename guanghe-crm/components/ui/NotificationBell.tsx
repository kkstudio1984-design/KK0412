'use client'

import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  title: string
  message: string | null
  type: string
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_DOT: Record<string, string> = {
  urgent:  '#f87171',
  warning: '#fbbf24',
  info:    '#38bdf8',
  success: '#34d399',
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setNotifications(data) })
      .catch(() => {})

    // Subscribe to realtime (best-effort)
    let channel: any = null
    try {
      const { createClient } = require('@/lib/supabase/client')
      const supabase = createClient()
      channel = supabase
        .channel('notifications_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        })
        .subscribe()
    } catch {}

    return () => {
      if (channel) {
        try {
          const { createClient } = require('@/lib/supabase/client')
          createClient().removeChannel(channel)
        } catch {}
      }
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
  }

  const timeAgo = (dateStr: string) => {
    try {
      const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
      if (mins < 1) return '剛剛'
      if (mins < 60) return `${mins} 分鐘前`
      const hours = Math.floor(mins / 60)
      if (hours < 24) return `${hours} 小時前`
      return `${Math.floor(hours / 24)} 天前`
    } catch {
      return ''
    }
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2" style={{ color: '#555' }}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
            <span className="text-sm font-semibold" style={{ color: '#e8e6e3' }}>通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs"
                style={{ color: '#fbbf24' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fcd34d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#fbbf24')}
              >
                全部已讀
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#555' }}>沒有通知</p>
            ) : (
              notifications.slice(0, 15).map(n => {
                const dotColor = TYPE_DOT[n.type] || '#555'
                const row = (
                  <div
                    key={n.id}
                    className="px-4 py-3"
                    style={{
                      borderBottom: '1px solid #222',
                      background: !n.read ? 'rgba(217,119,6,0.04)' : 'transparent',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                    onMouseLeave={e => (e.currentTarget.style.background = !n.read ? 'rgba(217,119,6,0.04)' : 'transparent')}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1 shrink-0 text-xs" style={{ color: dotColor }}>●</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug" style={{ color: n.read ? '#888' : '#e8e6e3', fontWeight: n.read ? 400 : 500 }}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: '#666' }}>{n.message}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: '#444' }}>{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )

                return n.link ? (
                  <a key={n.id} href={n.link} onClick={() => setOpen(false)} style={{ display: 'block', textDecoration: 'none' }}>
                    {row}
                  </a>
                ) : row
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
