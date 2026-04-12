'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { SOURCES, Source, ServiceType } from '@/lib/types'

export default function ClientForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // 組織資料
    name: '',
    taxId: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    contactLine: '',
    source: '自來客' as Source,
    orgNotes: '',
    // 空間服務
    serviceType: '借址登記' as ServiceType,
    plan: '',
    monthlyFee: '',
    notes: '',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('請填寫公司名稱'); return }
    if (!form.contactName.trim()) { toast.error('請填寫聯絡人姓名'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '新增失敗')
        return
      }

      toast.success('客戶新增成功！')
      router.push('/')
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── 組織資料 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          組織資料
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              公司名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="光合創學有限公司"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">統一編號</label>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => set('taxId', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              聯絡人姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.contactName}
              onChange={(e) => set('contactName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="王小明"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">聯絡電話</label>
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => set('contactPhone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0912-345-678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set('contactEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@mail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LINE 帳號</label>
            <input
              type="text"
              value={form.contactLine}
              onChange={(e) => set('contactLine', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="@lineaccount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">客戶來源</label>
            <select
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ── 空間服務 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          空間服務
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              服務類型 <span className="text-red-500">*</span>
            </label>
            <select
              value={form.serviceType}
              onChange={(e) => set('serviceType', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="借址登記">借址登記</option>
              <option value="共享工位">共享工位</option>
              <option value="場地租借">場地租借</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">方案名稱</label>
            <input
              type="text"
              value={form.plan}
              onChange={(e) => set('plan', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="標準方案"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              月費（新台幣）
            </label>
            <input
              type="number"
              min="0"
              value={form.monthlyFee}
              onChange={(e) => set('monthlyFee', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="補充說明..."
            />
          </div>
        </div>

        {form.serviceType === '借址登記' && (
          <p className="mt-3 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            借址登記客戶將自動建立 5 項 KYC 查核（預設「待查」）
          </p>
        )}
      </section>

      {/* ── 送出 ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {loading ? '新增中...' : '新增客戶'}
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
