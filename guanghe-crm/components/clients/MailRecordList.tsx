'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { MailRecord, MailType, PickupStatus } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { CanEdit, useRole } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  clientId: string
  initialRecords: MailRecord[]
}

const PICKUP_STYLES: Record<PickupStatus, string> = {
  '待領取': 'text-yellow-700 bg-yellow-50 border-yellow-200',
  '已領取': 'text-green-700 bg-green-50 border-green-200',
  '已退回': 'text-gray-500 bg-gray-50 border-gray-200',
}

const MAIL_TYPE_STYLES: Record<MailType, string> = {
  '掛號': 'text-blue-700 bg-blue-50',
  '平信': 'text-gray-600 bg-gray-50',
  '法院文書': 'text-red-700 bg-red-50 font-semibold',
}

export default function MailRecordList({ clientId, initialRecords }: Props) {
  const { canEdit } = useRole()
  const [records, setRecords] = useState<MailRecord[]>(initialRecords)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    mailType: '掛號' as MailType,
    trackingNumber: '',
    sender: '',
  })

  // Sort: 法院文書 first, then by date desc
  const sorted = [...records].sort((a, b) => {
    if (a.mailType === '法院文書' && b.mailType !== '法院文書') return -1
    if (b.mailType === '法院文書' && a.mailType !== '法院文書') return 1
    return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
  })

  const handleStatusChange = async (mailId: string, pickupStatus: PickupStatus) => {
    setUpdating(mailId)
    const prev = records
    setRecords((rs) => rs.map((r) => (r.id === mailId ? { ...r, pickupStatus } : r)))

    try {
      const res = await fetch(`/api/clients/${clientId}/mail`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailId, pickupStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success('信件狀態已更新')
    } catch {
      toast.error('更新失敗')
      setRecords(prev)
    } finally {
      setUpdating(null)
    }
  }

  const handleAdd = async () => {
    if (!form.receivedDate || !form.sender) { toast.error('請填寫必要欄位'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: MailRecord = {
        id: data.id,
        spaceClientId: data.space_client_id,
        receivedDate: data.received_date,
        mailType: data.mail_type,
        trackingNumber: data.tracking_number,
        sender: data.sender,
        pickupStatus: data.pickup_status,
        notifiedAt: data.notified_at,
        finalNoticeAt: data.final_notice_at,
        pickedUpAt: data.picked_up_at,
      }
      setRecords((rs) => [mapped, ...rs])
      toast.success('信件已登記')
      setShowModal(false)
      setForm({ receivedDate: new Date().toISOString().split('T')[0], mailType: '掛號', trackingNumber: '', sender: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const pendingCount = records.filter((r) => r.pickupStatus === '待領取').length

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-800">信件代收</h2>
          {pendingCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
              {pendingCount} 待領取
            </span>
          )}
        </div>
        <CanEdit>
          <button onClick={() => setShowModal(true)}
            className="text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold px-3 py-1.5 rounded-lg shadow-sm">
            + 登記信件
          </button>
        </CanEdit>
      </div>

      {sorted.length === 0 ? (
        <EmptyState illustration="documents" title="尚無信件" message="點擊「登記信件」新增收到的郵件" />
      ) : (
        <div className="space-y-2">
          {sorted.map((record) => (
            <div key={record.id}
              className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border ${
                record.mailType === '法院文書' ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
              }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${MAIL_TYPE_STYLES[record.mailType]}`}>
                    {record.mailType}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(record.receivedDate)}</span>
                </div>
                <p className="text-sm text-gray-700 truncate">{record.sender}</p>
                {record.trackingNumber && (
                  <p className="text-xs text-gray-400">掛號：{record.trackingNumber}</p>
                )}
              </div>
              <select
                value={record.pickupStatus}
                disabled={!canEdit || updating === record.id}
                onChange={(e) => handleStatusChange(record.id, e.target.value as PickupStatus)}
                className={`text-xs font-medium border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 shrink-0 ${PICKUP_STYLES[record.pickupStatus]}`}>
                <option value="待領取">待領取</option>
                <option value="已領取">已領取</option>
                <option value="已退回">已退回</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Add Mail Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-gray-800 mb-4">登記信件</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">收件日期</label>
                <input type="date" value={form.receivedDate} onChange={(e) => setForm(f => ({ ...f, receivedDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">信件類型</label>
                <select value={form.mailType} onChange={(e) => setForm(f => ({ ...f, mailType: e.target.value as MailType }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
                  <option value="掛號">掛號</option>
                  <option value="平信">平信</option>
                  <option value="法院文書">法院文書</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">掛號編號（選填）</label>
                <input value={form.trackingNumber} onChange={(e) => setForm(f => ({ ...f, trackingNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="選填" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">寄件單位</label>
                <input value={form.sender} onChange={(e) => setForm(f => ({ ...f, sender: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" placeholder="寄件單位名稱" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-slate-900 text-sm font-semibold py-2 rounded-lg shadow-sm">
                {adding ? '登記中...' : '確認登記'}
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
