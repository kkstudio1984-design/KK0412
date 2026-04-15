'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  initialExpenses: Expense[]
}

const CATEGORY_COLORS: Record<string, string> = {
  '租金': 'text-blue-700 bg-blue-50 border-blue-200',
  '水電': 'text-cyan-700 bg-cyan-50 border-cyan-200',
  '人事': 'text-purple-700 bg-purple-50 border-purple-200',
  '設備': 'text-stone-700 bg-stone-50 border-stone-200',
  '行銷': 'text-amber-700 bg-amber-50 border-amber-200',
  '其他': 'text-stone-500 bg-stone-50 border-stone-200',
}

export default function ExpenseList({ initialExpenses }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    category: '租金' as ExpenseCategory,
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  })

  const handleAdd = async () => {
    if (!form.amount || !form.description) { toast.error('請填寫金額和說明'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: Expense = {
        id: data.id,
        category: data.category,
        amount: data.amount,
        expenseDate: data.expense_date,
        description: data.description,
        receiptUrl: data.receipt_url,
        createdAt: data.created_at,
      }
      setExpenses([mapped, ...expenses])
      toast.success('費用已新增')
      setShowModal(false)
      setForm({ ...form, amount: '', description: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  const handleExport = () => {
    const headers = ['日期', '類別', '金額', '說明']
    const rows = expenses.map(e => [
      e.expenseDate, e.category, String(e.amount), e.description,
    ])
    downloadCSV(`費用紀錄_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">共 {expenses.length} 筆，合計 {formatNTD(total)}</p>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50">匯出 CSV</button>
          <CanEdit>
            <button onClick={() => setShowModal(true)} className="btn-primary">+ 新增費用</button>
          </CanEdit>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">日期</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">類別</th>
              <th className="text-right text-xs font-semibold text-stone-400 px-4 py-3">金額</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3">說明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-stone-50">
                <td className="px-4 py-3 text-stone-600">{formatDate(e.expenseDate)}</td>
                <td className="px-4 py-3"><span className={`badge ${CATEGORY_COLORS[e.category] || ''}`}>{e.category}</span></td>
                <td className="px-4 py-3 text-right font-semibold text-stone-800 tabular-nums">{formatNTD(e.amount)}</td>
                <td className="px-4 py-3 text-stone-600">{e.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && <EmptyState illustration="empty" title="尚無費用紀錄" message="點擊「+ 新增費用」記錄支出" />}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增費用</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">類別</label>
                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} className="input-base">
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">金額（NT$）</label>
                <input type="number" min="0" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">日期</label>
                <input type="date" value={form.expenseDate} onChange={(e) => setForm(f => ({ ...f, expenseDate: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">說明</label>
                <input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" placeholder="費用說明" />
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
