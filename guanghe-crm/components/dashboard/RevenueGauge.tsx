'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

interface Props {
  title: string
  value: number
  max: number
  color?: string
  label?: string
}

export default function RevenueGauge({ title, value, max, color = '#d97706', label }: Props) {
  const percentage = Math.min(100, Math.round((value / max) * 100))
  const data = [{ value: percentage }]

  return (
    <div className="card p-5 flex flex-col items-center">
      <p className="section-title mb-3 self-start">{title}</p>
      <div className="relative w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={225}
            endAngle={-45}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} fill={color} background={{ fill: '#1a1a1a' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold text-white tabular-nums">{percentage}%</p>
          {label && <p className="text-xs mt-1" style={{ color: '#9a9a9a' }}>{label}</p>}
        </div>
      </div>
    </div>
  )
}
