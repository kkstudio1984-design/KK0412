'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Sponsorship, SPONSORSHIP_TIERS, SPONSORSHIP_STATUSES, SponsorshipTier, SponsorshipStatus } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import { CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  initialSponsorships: Sponsorship[]
}

const TIER_COLORS: Record<SponsorshipTier, string> = {
  '種子級': 'bg-stone-100 text-stone-600 border-stone-200',
  '成長級': 'bg-amber-50 text-amber-700 border-amber-200',
  '共融級': 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_COLORS: Record<SponsorshipStatus, string> = {
  '洽談中': 'bg-stone-100 text-stone-600',
  '已簽約': 'bg-sky-50 text-sky-700',
  '執行中': 'bg-emerald-50 text-emerald-700',
  '已到期': 'bg-rose-50 text-rose-600',
}

export default function SponsorshipList({ initialSponsorships }: Props) {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>(initialSponsorships)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    orgName: '',
    tier: '種子級' as string,
    annualAmount: '',
    startDate: '',
    endDate: '',
    deliverables: '',
    status: '洽談中' as string,
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const resetForm = () => {
    setForm({
      orgName: '',
      tier: '種子級',
      annualAmount: '',
      startDate: '',
      endDate: '',
      deliverables: '',
      status: '洽談中',
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.orgName.trim()) { toast.error('請填寫組織名稱'); return }
    if (!form.annualAmount) { toast.error('請填寫年贊助金額'); return }

    setSaving(true)
    try {
      const res = await fetch('/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: form.orgName,
          tier: form.tier,
          annualAmount: Number(form.annualAmount),
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          deliverables: form.deliverables || null,
          status: form.status,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '新增失敗')
        return
      }

      const data = await res.json()
      toast.success('贊助新增成功！')
      setSponsorships((prev) => [data, ...prev])
      setShowModal(false)
      resetForm()
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">贊助列表</h2>
        <CanEdit>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <span className="text-base leading-none">+</span>
            新增贊助
          </button>
        </CanEdit>
      </div>

      {/* Sponsorship cards */}
      {sponsorships.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-400">尚無贊助紀錄</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sponsorships.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {s.organization?.name ?? s.orgId}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${TIER_COLORS[s.tier]}`}>
                      {s.tier}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-stone-700 tabular-nums">
                  {formatNTD(s.annualAmount)}<span className="text-stone-400 font-normal">/年</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                <span>{formatDate(s.startDate)} ~ {formatDate(s.endDate)}</span>
              </div>

              {s.deliverables && (
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {s.deliverables}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-800 text-lg">新增贊助</h3>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  組織名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.orgName}
                  onChange={(e) => set('orgName', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="企業名稱"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">贊助層級</label>
                  <select
                    value={form.tier}
                    onChange={(e) => set('tier', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  >
                    {SPONSORSHIP_TIERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    年贊助金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.annualAmount}
                    onChange={(e) => set('annualAmount', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">結束日期</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                  {SPONSORSHIP_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交付項目</label>
                <textarea
                  value={form.deliverables}
                  onChange={(e) => set('deliverables', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  placeholder="例：Logo 露出、活動冠名..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  {saving ? '新增中...' : '新增贊助'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
