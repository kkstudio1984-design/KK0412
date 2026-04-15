'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Contract, PaymentCycle } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import { CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  clientId: string
  serviceType: string
  monthlyFee: number
  initialContracts: Contract[]
  onContractCreated?: () => void
}

const DEPOSIT_STYLES: Record<string, string> = {
  '未收': 'text-gray-500 bg-gray-50 border-gray-200',
  '已收': 'text-green-700 bg-green-50 border-green-200',
  '已退': 'text-blue-700 bg-blue-50 border-blue-200',
}

export default function ContractList({ clientId, serviceType, monthlyFee, initialContracts, onContractCreated }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)

  // Default: suggest annual payment + 2 months deposit
  const [form, setForm] = useState({
    paymentCycle: '年繳' as PaymentCycle,
    startDate: '',
    endDate: '',
    monthlyRent: String(monthlyFee),
    depositAmount: String(monthlyFee * 2),
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleAdd = async () => {
    if (!form.startDate || !form.endDate || !form.monthlyRent) {
      toast.error('請填寫必要欄位')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType: serviceType,
          paymentCycle: form.paymentCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          monthlyRent: form.monthlyRent,
          depositAmount: form.depositAmount,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setContracts((cs) => [data.contract, ...cs].map((ct: any) => ({
        id: ct.id,
        spaceClientId: ct.space_client_id || ct.spaceClientId,
        contractType: ct.contract_type || ct.contractType,
        paymentCycle: ct.payment_cycle || ct.paymentCycle,
        startDate: ct.start_date || ct.startDate,
        endDate: ct.end_date || ct.endDate,
        monthlyRent: ct.monthly_rent ?? ct.monthlyRent,
        depositAmount: ct.deposit_amount ?? ct.depositAmount,
        depositStatus: ct.deposit_status || ct.depositStatus,
        isNotarized: ct.is_notarized ?? ct.isNotarized,
        notarizedAt: ct.notarized_at || ct.notarizedAt,
      })))
      toast.success(`合約已建立，自動產生 ${data.paymentsCreated} 筆繳款記錄`)
      setShowModal(false)
      if (onContractCreated) onContractCreated()
    } catch {
      toast.error('新增合約失敗')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">合約管理</h2>
        <CanEdit>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded-lg shadow-sm"
          >
            + 新增合約
          </button>
        </CanEdit>
      </div>

      {contracts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">尚無合約</p>
      ) : (
        <div className="space-y-3">
          {contracts.map((ct) => (
            <div key={ct.id} className="border border-gray-100 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{ct.contractType}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {ct.paymentCycle}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>期間：{formatDate(ct.startDate)} ~ {formatDate(ct.endDate)}</div>
                <div>月租：{formatNTD(ct.monthlyRent)}</div>
                <div className="flex items-center gap-1.5">
                  押金：{formatNTD(ct.depositAmount)}
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${DEPOSIT_STYLES[ct.depositStatus] || ''}`}>
                    {ct.depositStatus}
                  </span>
                </div>
                {ct.isNotarized && <div className="text-blue-600">已公證</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Contract Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-4">新增合約</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">合約類型</label>
                <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{serviceType}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">繳款週期</label>
                <select
                  value={form.paymentCycle}
                  onChange={(e) => set('paymentCycle', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="月繳">月繳</option>
                  <option value="季繳">季繳</option>
                  <option value="半年繳">半年繳</option>
                  <option value="年繳">年繳（建議）</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">起始日</label>
                  <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">到期日</label>
                  <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">月租金（NT$）</label>
                <input type="number" min="0" value={form.monthlyRent} onChange={(e) => set('monthlyRent', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">押金（NT$）— 建議為兩個月月租</label>
                <input type="number" min="0" value={form.depositAmount} onChange={(e) => set('depositAmount', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                建立合約後將依繳款週期自動產生繳款記錄
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-slate-900 text-sm font-semibold py-2 rounded-lg shadow-sm">
                {adding ? '建立中...' : '確認建立'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-sm text-gray-600 py-2 rounded-lg hover:bg-gray-50">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
