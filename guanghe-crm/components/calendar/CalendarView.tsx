'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isToday } from 'date-fns'

interface CalendarEvent {
  id: string
  date: string
  type: string
  color: string
  label: string
  detail: string
}

interface Props {
  events: CalendarEvent[]
  month: string // yyyy-MM
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function CalendarView({ events, month }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const targetDate = new Date(month + '-01')
  const monthStart = startOfMonth(targetDate)
  const monthEnd = endOfMonth(targetDate)
  const gridStart = startOfWeek(monthStart)
  const gridEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    const key = e.date
    if (!eventsByDate[key]) eventsByDate[key] = []
    eventsByDate[key].push(e)
  }

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : []

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <Legend color="#34d399" label="已收款" />
        <Legend color="#fbbf24" label="待收款" />
        <Legend color="#f87171" label="逾期" />
        <Legend color="#0ea5e9" label="客戶跟進" />
        <Legend color="#ec4899" label="課程場次" />
        <Legend color="#8b5cf6" label="合約到期" />
        <Legend color="#ef4444" label="法院文書" />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Headers */}
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-xs font-semibold text-center py-2" style={{ color: '#888' }}>
            週{d}
          </div>
        ))}

        {/* Days */}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate[dateStr] || []
          const inMonth = isSameMonth(day, targetDate)
          const today = isToday(day)
          const selected = selectedDate === dateStr

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(selected ? null : dateStr)}
              className="rounded-lg p-2 min-h-[90px] text-left"
              style={{
                background: selected ? 'rgba(217,119,6,0.15)' : '#111',
                border: selected
                  ? '1px solid #d97706'
                  : today
                  ? '1px solid rgba(217,119,6,0.4)'
                  : '1px solid #1f1f1f',
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: today ? '#fbbf24' : inMonth ? '#e8e6e3' : '#555' }}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span
                    className="text-xs font-semibold rounded-full px-1.5 tabular-nums"
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#e8e6e3' }}
                  >
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    className="text-[10px] truncate rounded px-1 py-0.5"
                    style={{
                      background: `${e.color}20`,
                      color: e.color,
                    }}
                    title={`${e.label} · ${e.detail}`}
                  >
                    {e.label}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px]" style={{ color: '#666' }}>
                    +{dayEvents.length - 3} 筆
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="mt-6 card p-5">
          <p className="section-title mb-3">{format(new Date(selectedDate), 'yyyy 年 M 月 d 日')} 共 {selectedEvents.length} 筆</p>
          {selectedEvents.length === 0 ? (
            <p className="text-sm" style={{ color: '#666' }}>無活動</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#0a0a0a' }}>
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ background: e.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{e.label}</p>
                    <p className="text-xs" style={{ color: '#9a9a9a' }}>{e.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span style={{ color: '#9a9a9a' }}>{label}</span>
    </div>
  )
}
