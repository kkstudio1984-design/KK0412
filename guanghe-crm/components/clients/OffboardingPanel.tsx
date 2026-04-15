'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { OffboardingRecord, MigrationStatus, SettlementStatus, RefundStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { CanEdit, useRole } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  clientId: string
  serviceType: string
  initialRecords: OffboardingRecord[]
}

const SETTLEMENT_STYLES: Record<SettlementStatus, string> = {
  '待結算': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '已結算': 'text-green-700 bg-green-50 border-green-200',
}

const MIGRATION_STYLES: Record<MigrationStatus, string> = {
  '待遷出': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '已通知': 'text-blue-700 bg-blue-50 border-blue-200',
  '逾期未遷': 'text-red-700 bg-red-50 border-red-200',
  '已確認遷出': 'text-green-700 bg-green-50 border-green-200',
}

const REFUND_STYLES: Record<RefundStatus, string> = {
  '待退': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '部分扣抵': 'text-orange-700 bg-orange-50 border-orange-200',
  '已退': 'text-green-700 bg-green-50 border-green-200',
  '全額沒收': 'text-red-700 bg-red-50 border-red-200',
}

export default function OffboardingPanel({ clientId, serviceType, initialRecords }: Props) {
  const { canEdit } = useRole()
  const [records, setRecords] = useState<OffboardingRecord[]>(initialRecords)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ contractEndDate: '', earlyTermination: false, penaltyAmount: '' })
  const [updating, setUpdating] = useState(false)

  const handleCreate = async () => {
    if (!form.contractEndDate) { toast.error('請填寫合約到期日'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/offboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: OffboardingRecord = {
        id: data.id,
        spaceClientId: data.space_client_id,
        requestDate: data.request_date,
        contractEndDate: data.contract_end_date,
        earlyTermination: data.early_termination,
        penaltyAmount: data.penalty_amount,
        settlementStatus: data.settlement_status,
        addressMigrationStatus: data.address_migration_status,
        migrationDeadline: data.migration_deadline,
        migrationConfirmedAt: data.migration_confirmed_at,
        depositRefundStatus: data.deposit_refund_status,
        depositRefundAmount: data.deposit_refund_amount,
        depositDeductionReason: data.deposit_deduction_reason,
        status: data.status,
        closedAt: data.closed_at,
      }
      setRecords([mapped, ...records])
      toast.success('退租流程已啟動')
      setShowModal(false)
    } catch {
      toast.error('建立退租紀錄失敗')
    } finally {
      setAdding(false)
    }
  }

  const handleUpdate = async (recordId: string, updates: any) => {
    setUpdating(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/offboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, ...updates }),
      })
      if (!res.ok) throw new Error()
      setRecords((rs) => rs.map((r) => r.id === recordId ? { ...r, ...updates } : r))
      toast.success('退租狀態已更新')
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdating(false)
    }
  }

  const activeRecord = records.find((r) => r.status === '進行中')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">退場流程</h2>
        {!activeRecord && (
          <CanEdit>
            <button onClick={() => setShowModal(true)}
              className="text-sm bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              啟動退租
            </button>
          </CanEdit>
        )}
      </div>

      {records.length === 0 ? (
        <EmptyState illustration="empty" title="未啟動退租" message="客戶要退場時，點擊右上「啟動退租」建立流程" />
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const migrationDaysLeft = differenceInDays(new Date(record.migrationDeadline), new Date())
            return (
              <div key={record.id} className={`border rounded-lg p-4 ${record.status === '已結案' ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-orange-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${record.status === '進行中' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-gray-500 bg-gray-100 border-gray-200'}`}>
                    {record.status}
                  </span>
                  {record.earlyTermination && (
                    <span className="text-xs text-red-600 font-medium">提前解約</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                  <div>提出日期：{formatDate(record.requestDate)}</div>
                  <div>合約到期：{formatDate(record.contractEndDate)}</div>
                  <div className={migrationDaysLeft < 0 ? 'text-red-600 font-medium' : ''}>
                    遷出期限：{formatDate(record.migrationDeadline)}
                    {migrationDaysLeft < 0 ? ` (逾期 ${Math.abs(migrationDaysLeft)} 天)` : ` (剩 ${migrationDaysLeft} 天)`}
                  </div>
                  {record.penaltyAmount && <div>違約金：NT${record.penaltyAmount.toLocaleString()}</div>}
                </div>

                {record.status === '進行中' && (
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">結算狀態</span>
                      <select value={record.settlementStatus} disabled={!canEdit || updating}
                        onChange={(e) => handleUpdate(record.id, { settlementStatus: e.target.value })}
                        className={`text-xs font-medium border rounded-lg px-2 py-1 ${SETTLEMENT_STYLES[record.settlementStatus]}`}>
                        <option value="待結算">待結算</option>
                        <option value="已結算">已結算</option>
                      </select>
                    </div>

                    {serviceType === '借址登記' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">地址遷出</span>
                        <select value={record.addressMigrationStatus} disabled={!canEdit || updating}
                          onChange={(e) => handleUpdate(record.id, { addressMigrationStatus: e.target.value })}
                          className={`text-xs font-medium border rounded-lg px-2 py-1 ${MIGRATION_STYLES[record.addressMigrationStatus]}`}>
                          <option value="待遷出">待遷出</option>
                          <option value="已通知">已通知</option>
                          <option value="逾期未遷">逾期未遷</option>
                          <option value="已確認遷出">已確認遷出</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">押金退還</span>
                      <select value={record.depositRefundStatus} disabled={!canEdit || updating}
                        onChange={(e) => handleUpdate(record.id, { depositRefundStatus: e.target.value })}
                        className={`text-xs font-medium border rounded-lg px-2 py-1 ${REFUND_STYLES[record.depositRefundStatus]}`}>
                        <option value="待退">待退</option>
                        <option value="部分扣抵">部分扣抵</option>
                        <option value="已退">已退</option>
                        <option value="全額沒收">全額沒收</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Offboarding Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-gray-800 mb-4">啟動退租流程</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">合約到期日</label>
                <input type="date" value={form.contractEndDate}
                  onChange={(e) => setForm(f => ({ ...f, contractEndDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="earlyTerm" checked={form.earlyTermination}
                  onChange={(e) => setForm(f => ({ ...f, earlyTermination: e.target.checked }))}
                  className="rounded border-gray-300" />
                <label htmlFor="earlyTerm" className="text-sm text-gray-700">提前解約</label>
              </div>
              {form.earlyTermination && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">違約金（NT$）</label>
                  <input type="number" min="0" value={form.penaltyAmount}
                    onChange={(e) => setForm(f => ({ ...f, penaltyAmount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                </div>
              )}
              <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                啟動後客戶將自動移至「退租中」，遷出期限為合約到期日 + 30 天
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} disabled={adding}
                className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:opacity-60 text-white text-sm font-semibold py-2 rounded-lg shadow-sm">
                {adding ? '建立中...' : '確認啟動'}
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
