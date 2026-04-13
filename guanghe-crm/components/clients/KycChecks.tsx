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
  const [overrideTarget, setOverrideTarget] = useState<string | null>(null)
  const [overrideReason, setOverrideReason] = useState('')

  const passedCount = checks.filter((c) => c.status === '通過').length

  const handleChange = async (kycId: string, status: KycStatus) => {
    setUpdating(kycId)
    const prev = checks
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
      setChecks(prev)
    } finally {
      setUpdating(null)
    }
  }

  const handleOverride = async (kycId: string) => {
    if (!overrideReason.trim()) {
      toast.error('請填寫覆核原因')
      return
    }
    setUpdating(kycId)
    const prev = checks
    setChecks((cs) => cs.map((c) => (c.id === kycId ? { ...c, status: '通過' as KycStatus, overrideReason: overrideReason } : c)))

    try {
      const res = await fetch(`/api/clients/${clientId}/kyc`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycId, status: '通過', overrideReason: overrideReason }),
      })
      if (!res.ok) throw new Error()
      toast.success('已覆核通過')
      setOverrideTarget(null)
      setOverrideReason('')
    } catch {
      toast.error('覆核失敗')
      setChecks(prev)
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
          <div key={check.id}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-base shrink-0">{STATUS_ICON[check.status]}</span>
                <span className="text-sm text-gray-700 truncate">{check.checkType}</span>
                {check.overrideReason && (
                  <span className="text-xs text-gray-400 truncate" title={check.overrideReason}>
                    (覆核)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
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
                {check.status === '異常' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideTarget(overrideTarget === check.id ? null : check.id)
                      setOverrideReason('')
                    }}
                    className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 hover:bg-amber-100 transition-colors whitespace-nowrap"
                  >
                    覆核
                  </button>
                )}
              </div>
            </div>
            {/* Override inline input */}
            {overrideTarget === check.id && (
              <div className="mt-2 ml-7 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="覆核原因（必填）"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  disabled={updating === check.id}
                  onClick={() => handleOverride(check.id)}
                  className="text-xs text-white bg-amber-600 hover:bg-amber-700 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
                >
                  確認
                </button>
                <button
                  type="button"
                  onClick={() => { setOverrideTarget(null); setOverrideReason('') }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
