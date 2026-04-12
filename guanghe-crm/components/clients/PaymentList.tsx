'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Payment, PaymentStatus } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'

interface Props {
  clientId: string
  initialPayments: Payment[]
}

const STATUS_STYLE: Record<PaymentStatus, string> = {
  '已收': 'text-green-700 bg-green-50 border-green-200',
  '逾期': 'text-red-700 bg-red-50 border-red-200',
  '未收': 'text-gray-500 bg-gray-50 border-gray-200',
}

export default function PaymentList({ clientId, initialPayments }: Props) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [newDueDate, setNewDueDate] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [adding, setAdding] = useState(false)

  const toggleStatus = async (payment: Payment) => {
    const next: PaymentStatus =
      payment.status === '未收' ? '已收' : payment.status === '已收' ? '逾期' : '未收'

    setUpdating(payment.id)
    setPayments((ps) => ps.map((p) => (p.id === payment.id ? { ...p, status: next } : p)))

    try {
      const res = await fetch(`/api/clients/${clientId}/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      const updated: Payment = await res.json()
      setPayments((ps) => ps.map((p) => (p.id === payment.id ? updated : p)))
      toast.success('收款狀態已更新')
    } catch {
      toast.error('更新失敗')
      setPayments(initialPayments)
    } finally {
      setUpdating(null)
    }
  }

  const handleAdd = async () => {
    if (!newDueDate || !newAmount) { toast.error('請填寫應繳日期和金額'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDueDate, amount: newAmount }),
      })
      if (!res.ok) throw new Error()
      const payment: Payment = await res.json()
      setPayments((ps) => [...ps, payment])
      toast.success('收款紀錄已新增')
      setShowModal(false)
      setNewDueDate('')
      setNewAmount('')
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">收款紀錄</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded-lg shadow-sm"
        >
          + 新增收款
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">尚無收款紀錄</p>
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700">{formatDate(payment.dueDate)}</p>
                {payment.paidAt && (
                  <p className="text-xs text-gray-400">收款：{formatDate(payment.paidAt)}</p>
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 shrink-0">
                {formatNTD(payment.amount)}
              </span>
              <button
                disabled={updating === payment.id}
                onClick={() => toggleStatus(payment)}
                className={`text-xs font-medium border rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors disabled:opacity-50 shrink-0 ${STATUS_STYLE[payment.status]}`}
              >
                {payment.status}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 新增收款 Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80">
            <h3 className="font-semibold text-gray-800 mb-4">新增收款紀錄</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">應繳日期</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">金額（NT$）</label>
                <input
                  type="number"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="2500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-slate-900 text-sm font-semibold py-2 rounded-lg shadow-sm"
              >
                {adding ? '新增中...' : '確認新增'}
              </button>
              <button
                onClick={() => { setShowModal(false); setNewDueDate(''); setNewAmount('') }}
                className="flex-1 border border-gray-300 text-sm text-gray-600 py-2 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
