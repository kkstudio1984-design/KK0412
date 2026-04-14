'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface Props {
  data: { type: string; amount: number }[]
}

const COLORS = ['#d97706', '#0284c7', '#059669', '#7c3aed', '#db2777', '#a8a29e']

export default function RevenueChart({ data }: Props) {
  if (data.length === 0) return null

  return (
    <div className="card p-5">
      <p className="section-title mb-3">收入佔比</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="type"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `NT$${Number(value).toLocaleString()}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e8e5e0', fontSize: '12px' }}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-stone-600">{value}</span>}
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
