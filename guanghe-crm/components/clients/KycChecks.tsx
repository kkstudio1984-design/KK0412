'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { KycCheck, KycStatus } from '@/lib/types'

interface Props {
  clientId: string
  initialChecks: KycCheck[]
}

const STATUS_ICON: Record<KycStatus, string> = {
  '通過': '✅',
  '異常': '❌',
  '待查': '⏳',
}

const STATUS_COLOR: Record<KycStatus, string> = {
  '通過': 'text-green-700 bg-green-50 border-green-200',
  '異常': 'text-red-700 bg-red-50 border-red-200',
  '待查': 'text-gray-600 bg-gray-50 border-gray-200',
}

export default function KycChecks({ clientId, initialChecks }: Props) {
  const [checks, setChecks] = useState<KycCheck[]>(initialChecks)
  const [updating, setUpdating] = useState<string | null>(null)

  const passedCount = checks.filter((c) => c.status === '通過').length

  const handleChange = async (kycId: string, status: KycStatus) => {
    setUpdating(kycId)
    // Optimistic update
    setChecks((cs) => cs.map((c) => (c.id === kycId ? { ...c, status } : c)))

    try {
      const res = await fetch(`/api/clients/${clientId}/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId, status }),
      })
      if (!res.ok) throw new Error()
      toast.success('KYC 已更新')
    } catch {
      toast.error('更新失敗')
      // rollback
      setChecks(initialChecks)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">KYC 查核</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
          passedCount === 5
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-yellow-700 bg-yellow-50 border-yellow-200'
        }`}>
          {passedCount} / 5 通過
        </span>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-base shrink-0">{STATUS_ICON[check.status]}</span>
              <span className="text-sm text-gray-700 truncate">{check.checkType}</span>
            </div>
            <select
              value={check.status}
              disabled={updating === check.id}
              onChange={(e) => handleChange(check.id, e.target.value as KycStatus)}
              className={`text-xs font-medium border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${STATUS_COLOR[check.status]}`}
            >
              <option value="通過">通過</option>
              <option value="異常">異常</option>
              <option value="待查">待查</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
