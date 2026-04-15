'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts'

interface Point {
  month: string
  value: number
}

interface Props {
  title: string
  data: Point[]
  color?: string
  format?: 'currency' | 'number'
}

export default function TrendChart({ title, data, color = '#d97706', format = 'number' }: Props) {
  if (!data || data.length === 0) return null

  const formatter = (v: number) =>
    format === 'currency' ? `NT$${v.toLocaleString()}` : v.toLocaleString()

  return (
    <div className="card p-5">
      <p className="section-title mb-3">{title}</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#666' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#666' }} tickLine={false} axisLine={false} tickFormatter={formatter} width={70} />
            <Tooltip
              formatter={(v: unknown) => formatter(Number(v))}
              contentStyle={{ borderRadius: '8px', border: '1px solid #333', background: '#111', fontSize: '12px' }}
              labelStyle={{ color: '#e8e6e3' }}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#gradient-${color})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
