'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { LEAD_CHANNELS, LEAD_INTERESTS, LeadChannel, LeadInterest } from '@/lib/types'
import { useRole } from '@/components/providers/RoleProvider'

export default function LeadForm() {
  const router = useRouter()
  const { canEdit, loading: roleLoading } = useRole()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    contactName: '',
    contactInfo: '',
    channel: 'self' as string,
    interest: '借址登記' as string,
    followUpDate: '',
    notes: '',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contactName.trim()) {
      toast.error('請填寫聯絡人姓名')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: form.contactName,
          contactInfo: form.contactInfo || null,
          channel: form.channel,
          interest: form.interest,
          followUpDate: form.followUpDate || null,
          notes: form.notes || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '新增失敗')
        return
      }

      toast.success('潛在客戶新增成功！')
      router.push('/sales')
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  if (roleLoading) return <div>載入中...</div>
  if (!canEdit) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm" style={{ color: '#9a9a9a' }}>您無權限新增潛在客戶</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          聯絡資訊
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="王小明"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡方式（電話 / Email / LINE）
            </label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => set('contactInfo', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="0912-345-678 或 example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">來源管道</label>
            <select
              value={form.channel}
              onChange={(e) => set('channel', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {LEAD_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求興趣</label>
            <select
              value={form.interest}
              onChange={(e) => set('interest', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            >
              {LEAD_INTERESTS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">跟進日期</label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={(e) => set('followUpDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              placeholder="補充說明..."
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          {loading ? '新增中...' : '新增潛在客戶'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
        >
          取消
        </button>
      </div>
    </form>
  )
}
