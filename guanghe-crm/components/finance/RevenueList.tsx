'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { RevenueRecord, RevenueCategory, REVENUE_CATEGORIES } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  initialRecords: RevenueRecord[]
}

const STATUS_STYLES: Record<string, string> = {
  '已收': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '未收': 'text-stone-500 bg-stone-50 border-stone-200',
  '逾期': 'text-red-700 bg-red-50 border-red-200',
}

export default function RevenueList({ initialRecords }: Props) {
  const [records, setRecords] = useState<RevenueRecord[]>(initialRecords)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    sourceModule: 'M1空間' as string,
    amount: '',
    revenueDate: new Date().toISOString().split('T')[0],
    category: '借址' as RevenueCategory,
    status: '已收',
    description: '',
  })

  const handleAdd = async () => {
    if (!form.amount || !form.revenueDate) { toast.error('請填寫金額和日期'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/finance/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: RevenueRecord = {
        id: data.id,
        sourceModule: data.source_module,
        sourceId: data.source_id,
        amount: data.amount,
        revenueDate: data.revenue_date,
        category: data.category,
        status: data.status,
        description: data.description,
        createdAt: data.created_at,
      }
      setRecords([mapped, ...records])
      toast.success('營收已新增')
      setShowModal(false)
      setForm({ ...form, amount: '', description: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const total = records.reduce((sum, r) => sum + r.amount, 0)

  const handleExport = () => {
    const headers = ['日期', '來源', '類別', '金額', '狀態', '說明']
    const rows = records.map(r => [
      r.revenueDate, r.sourceModule, r.category, String(r.amount), r.status, r.description || '',
    ])
    downloadCSV(`營收紀錄_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">共 {records.length} 筆，合計 {formatNTD(total)}</p>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50">匯出 CSV</button>
          <CanEdit>
            <button onClick={() => setShowModal(true)} className="btn-primary">+ 新增營收</button>
          </CanEdit>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">日期</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">來源</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">類別</th>
              <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">金額</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">狀態</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">說明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-stone-600">{formatDate(r.revenueDate)}</td>
                <td className="px-4 py-3 text-stone-500 text-xs">{r.sourceModule}</td>
                <td className="px-4 py-3"><span className="badge bg-amber-50 text-amber-700 border-amber-200">{r.category}</span></td>
                <td className="px-4 py-3 text-right font-semibold text-stone-800 tabular-nums">{formatNTD(r.amount)}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS_STYLES[r.status] || ''}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-stone-400 truncate max-w-[200px]">{r.description || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && <EmptyState illustration="sales" title="尚無營收紀錄" message="點擊「+ 新增營收」記錄收入" />}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增營收</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">來源模組</label>
                <select value={form.sourceModule} onChange={(e) => setForm(f => ({ ...f, sourceModule: e.target.value }))} className="input-base">
                  <option value="M1空間">M1 空間</option>
                  <option value="M2專案">M2 專案</option>
                  <option value="M3贊助">M3 贊助</option>
                  <option value="M5培訓">M5 培訓</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">類別</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as RevenueCategory }))} className="input-base">
                  {REVENUE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">金額（NT$）</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="input-base" placeholder="2500" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">日期</label>
                <input type="date" value={form.revenueDate} onChange={(e) => setForm(f => ({ ...f, revenueDate: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">說明</label>
                <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" placeholder="選填" />
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
