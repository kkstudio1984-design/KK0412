'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { SubsidyTracking, APPLICATION_STATUSES, DISBURSEMENT_STATUSES } from '@/lib/types'
import { formatNTD } from '@/lib/utils'

interface Props {
  initialSubsidies: SubsidyTracking[]
}

const APP_STYLES: Record<string, string> = {
  '未申請': 'text-stone-500 bg-stone-50 border-stone-200',
  '已申請': 'text-blue-700 bg-blue-50 border-blue-200',
  '審核中': 'text-amber-700 bg-amber-50 border-amber-200',
  '核准': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '駁回': 'text-red-700 bg-red-50 border-red-200',
}

const DISB_STYLES: Record<string, string> = {
  '未撥款': 'text-stone-500 bg-stone-50 border-stone-200',
  '部分撥款': 'text-amber-700 bg-amber-50 border-amber-200',
  '全額撥款': 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

export default function SubsidyList({ initialSubsidies }: Props) {
  const [subsidies, setSubsidies] = useState<SubsidyTracking[]>(initialSubsidies)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [form, setForm] = useState({ subsidyName: '', agency: '', annualAmount: '', notes: '' })

  const handleAdd = async () => {
    if (!form.subsidyName || !form.agency || !form.annualAmount) { toast.error('請填寫必要欄位'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/finance/subsidies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: SubsidyTracking = {
        id: data.id,
        subsidyName: data.subsidy_name,
        agency: data.agency,
        annualAmount: data.annual_amount,
        applicationStatus: data.application_status,
        disbursementStatus: data.disbursement_status,
        relatedPartners: data.related_partners || [],
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
      setSubsidies([mapped, ...subsidies])
      toast.success('補助已新增')
      setShowModal(false)
      setForm({ subsidyName: '', agency: '', annualAmount: '', notes: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const handleStatusChange = async (id: string, field: string, value: string) => {
    setUpdating(id)
    try {
      const res = await fetch(`/api/finance/subsidies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) throw new Error()
      setSubsidies(ss => ss.map(s => s.id === id ? { ...s, [field]: value } : s))
      toast.success('狀態已更新')
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">共 {subsidies.length} 筆</p>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ 新增補助</button>
      </div>

      {subsidies.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-sm text-stone-300">尚無補助紀錄</p></div>
      ) : (
        <div className="space-y-3">
          {subsidies.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-stone-800">{s.subsidyName}</h3>
                <span className="text-sm font-bold text-stone-800 tabular-nums">{formatNTD(s.annualAmount)}/年</span>
              </div>
              <p className="text-xs text-stone-400 mb-3">{s.agency}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">申請：</span>
                  <select
                    value={s.applicationStatus}
                    disabled={updating === s.id}
                    onChange={(e) => handleStatusChange(s.id, 'applicationStatus', e.target.value)}
                    className={`badge cursor-pointer ${APP_STYLES[s.applicationStatus]}`}
                  >
                    {APPLICATION_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">撥款：</span>
                  <select
                    value={s.disbursementStatus}
                    disabled={updating === s.id}
                    onChange={(e) => handleStatusChange(s.id, 'disbursementStatus', e.target.value)}
                    className={`badge cursor-pointer ${DISB_STYLES[s.disbursementStatus]}`}
                  >
                    {DISBURSEMENT_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              {s.notes && <p className="text-xs text-stone-400 mt-2">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增補助</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">補助名稱</label>
                <input value={form.subsidyName} onChange={(e) => setForm(f => ({ ...f, subsidyName: e.target.value }))} className="input-base" placeholder="身心障礙者僱用獎助" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">主管機關</label>
                <input value={form.agency} onChange={(e) => setForm(f => ({ ...f, agency: e.target.value }))} className="input-base" placeholder="勞動部" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">年度金額（NT$）</label>
                <input type="number" min="0" value={form.annualAmount} onChange={(e) => setForm(f => ({ ...f, annualAmount: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">備註</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">{adding ? '新增中...' : '確認新增'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
