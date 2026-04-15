'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Lead } from '@/lib/types'
import { CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  lead: Lead
}

function getConvertLabel(interest: string): string {
  switch (interest) {
    case '借址登記': return '空間客戶（借址登記）'
    case '工位': return '空間客戶（共享工位）'
    case '場地': return '空間客戶（場地租借）'
    case 'ESG贊助': return 'ESG 贊助案'
    default: return '空間客戶'
  }
}

export default function LeadConvertButton({ lead }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Already converted
  if (lead.convertedTo) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              已轉換
            </span>
            <span className="text-sm text-emerald-700">此線索已成功轉換為客戶</span>
          </div>
          <Link
            href={`/clients/${lead.convertedTo}`}
            className="text-sm text-amber-600 hover:text-amber-800 font-medium hover:underline"
          >
            查看客戶 →
          </Link>
        </div>
      </div>
    )
  }

  // Not eligible for conversion
  if (lead.stage !== '成交') {
    return null
  }

  const handleConvert = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '轉換失敗')
        return
      }

      const data = await res.json()
      toast.success('成功轉換為客戶！')
      router.push(`/clients/${data.clientId}`)
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CanEdit>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-0.5">準備轉換</p>
            <p className="text-xs text-amber-600">
              將建立：{getConvertLabel(lead.interest)}
            </p>
          </div>
          <button
            onClick={handleConvert}
            disabled={loading}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold px-5 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            {loading ? '轉換中...' : '轉換為客戶'}
          </button>
        </div>
      </div>
    </CanEdit>
  )
}
