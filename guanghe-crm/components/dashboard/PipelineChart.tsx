'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

interface Props {
  data: { stage: string; count: number }[]
}

const STAGE_COLORS: Record<string, string> = {
  '初步詢問': '#a8a29e',
  'KYC審核中': '#d97706',
  '已簽約': '#0284c7',
  '服務中': '#059669',
  '退租中': '#ea580c',
  '已結案': '#7c3aed',
  '已流失': '#e11d48',
}

export default function PipelineChart({ data }: Props) {
  if (data.every(d => d.count === 0)) return null

  return (
    <div className="card p-5">
      <p className="section-title mb-3">Pipeline 分佈</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e8e5e0', fontSize: '12px' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={STAGE_COLORS[entry.stage] || '#a8a29e'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
