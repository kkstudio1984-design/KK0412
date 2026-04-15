'use client'

interface Props {
  title: string
  data: { date: string; count: number }[]
  colorBase?: string // rgb values without alpha e.g. "217, 119, 6"
}

export default function ActivityHeatmap({ title, data, colorBase = '217, 119, 6' }: Props) {
  // Build last 12 weeks (84 days) from today backwards
  const today = new Date()
  const cells: { date: string; count: number; day: number }[] = []

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const found = data.find((x) => x.date === dateStr)
    cells.push({ date: dateStr, count: found?.count || 0, day: d.getDay() })
  }

  const max = Math.max(1, ...cells.map((c) => c.count))

  const getColor = (count: number) => {
    if (count === 0) return '#1a1a1a'
    const intensity = Math.min(1, count / max)
    const alpha = 0.15 + intensity * 0.85
    return `rgba(${colorBase}, ${alpha})`
  }

  // Group by week (7 cells per column)
  const weeks: typeof cells[] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']
  const totalEvents = cells.reduce((s, c) => s + c.count, 0)

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title">{title}</p>
        <span className="text-xs" style={{ color: '#888' }}>過去 12 週 · 共 {totalEvents} 筆</span>
      </div>
      <div className="flex gap-1">
        {/* Day labels on left */}
        <div className="flex flex-col gap-1 pr-1 pt-0.5">
          {dayLabels.map((label, i) => (
            <div key={i} className="w-3 h-3 flex items-center justify-end" style={{ fontSize: '8px', color: '#555' }}>
              {i % 2 === 1 ? label : ''}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  className="w-3 h-3 rounded-sm group relative cursor-pointer"
                  style={{ background: getColor(cell.count) }}
                  title={`${cell.date}：${cell.count} 筆`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-xs" style={{ color: '#555' }}>少</span>
        {[0, 0.25, 0.5, 0.75, 1].map((alpha, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: alpha === 0 ? '#1a1a1a' : `rgba(${colorBase}, ${0.15 + alpha * 0.85})` }} />
        ))}
        <span className="text-xs" style={{ color: '#555' }}>多</span>
      </div>
    </div>
  )
}
