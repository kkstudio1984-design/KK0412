'use client'

import { useState } from 'react'
import EmptyState from '@/components/ui/EmptyState'

interface TrainingRecord { id: string; partnerId: string; trainingType: string; toolName: string | null; completedAt: string | null; status: string; assessmentScore: number | null; createdAt: string; partnerName: string }
interface Props { initialRecords: TrainingRecord[] }

const STATUS_STYLES: Record<string, string> = {
  '未開始': 'text-stone-500 bg-stone-50 border-stone-200',
  '進行中': 'text-blue-700 bg-blue-50 border-blue-200',
  '已完成': 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

export default function TrainingRecordList({ initialRecords }: Props) {
  const [records] = useState(initialRecords)

  return (
    <div>
      <h2 className="font-semibold text-stone-800 mb-4">夥伴培訓紀錄</h2>
      {records.length === 0 ? (
        <div className="card"><EmptyState illustration="training" title="尚無培訓紀錄" message="記錄夥伴的培訓進度與評分" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">夥伴</th>
                <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">培訓類型</th>
                <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">工具</th>
                <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">狀態</th>
                <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">評分</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-700">{r.partnerName}</td>
                  <td className="px-4 py-3 text-stone-600">{r.trainingType}</td>
                  <td className="px-4 py-3 text-stone-500">{r.toolName || '—'}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right text-stone-700 tabular-nums">{r.assessmentScore ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
