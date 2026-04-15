'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit, useRole } from '@/components/providers/RoleProvider'
import { formatDate } from '@/lib/utils'

interface ChangeRecord {
  id: string
  change_type: string
  old_value: string | null
  new_value: string | null
  notified_agencies: string[] | null
  notification_status: string
  notified_at: string | null
  notes: string | null
  created_at: string
}

interface Props {
  clientId: string
  initialChanges: ChangeRecord[]
}

const CHANGE_TYPES = ['地址變更', '負責人變更', '名稱變更', '統編變更', '其他']
const STATUSES = ['待通知', '已通知', '已確認', '不需通知']
const AGENCIES = ['國稅局', '商業司', '金管會', '其他']

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  地址變更: { bg: 'rgba(217,119,6,0.12)', color: '#fbbf24', border: 'rgba(217,119,6,0.3)' },
  負責人變更: { bg: 'rgba(139,92,246,0.12)', color: '#c4b5fd', border: 'rgba(139,92,246,0.3)' },
  名稱變更: { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
  統編變更: { bg: 'rgba(236,72,153,0.12)', color: '#f9a8d4', border: 'rgba(236,72,153,0.3)' },
  其他: { bg: 'rgba(120,113,108,0.12)', color: '#a8a29e', border: 'rgba(120,113,108,0.3)' },
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  待通知: { bg: 'rgba(217,119,6,0.12)', color: '#fbbf24', border: 'rgba(217,119,6,0.3)' },
  已通知: { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
  已確認: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  不需通知: { bg: 'rgba(120,113,108,0.12)', color: '#a8a29e', border: 'rgba(120,113,108,0.3)' },
}

export default function ChangeNotifications({ clientId, initialChanges }: Props) {
  const { canEdit } = useRole()
  const [changes, setChanges] = useState<ChangeRecord[]>(initialChanges)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    changeType: '地址變更',
    oldValue: '',
    newValue: '',
    notes: '',
  })

  const handleAdd = async () => {
    if (!form.changeType) {
      toast.error('請選擇變更類型')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChanges([data, ...changes])
      toast.success('變更已記錄')
      setShowModal(false)
      setForm({ changeType: '地址變更', oldValue: '', newValue: '', notes: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/clients/${clientId}/changes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationStatus: status }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChanges((cs) => cs.map((c) => (c.id === id ? { ...c, ...data } : c)))
      toast.success('狀態已更新')
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAgencyToggle = async (change: ChangeRecord, agency: string) => {
    const current = change.notified_agencies || []
    const next = current.includes(agency)
      ? current.filter((a) => a !== agency)
      : [...current, agency]
    setUpdatingId(change.id)
    try {
      const res = await fetch(`/api/clients/${clientId}/changes/${change.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifiedAgencies: next }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setChanges((cs) => cs.map((c) => (c.id === change.id ? { ...c, ...data } : c)))
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-stone-800">客戶變更通知</h2>
        <CanEdit>
          <button onClick={() => setShowModal(true)} className="text-xs text-amber-700 hover:text-amber-800">
            + 記錄變更
          </button>
        </CanEdit>
      </div>

      {changes.length === 0 ? (
        <p className="text-sm text-stone-400 text-center py-6">尚無變更記錄</p>
      ) : (
        <div className="space-y-3">
          {changes.map((c) => {
            const typeStyle = TYPE_STYLES[c.change_type] || TYPE_STYLES['其他']
            const statusStyle = STATUS_STYLES[c.notification_status] || STATUS_STYLES['待通知']
            return (
              <div key={c.id} className="border border-stone-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        border: `1px solid ${typeStyle.border}`,
                      }}
                    >
                      {c.change_type}
                    </span>
                    <span className="text-xs text-stone-400 tabular-nums">{formatDate(c.created_at)}</span>
                  </div>
                  <select
                    value={c.notification_status}
                    disabled={!canEdit || updatingId === c.id}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className="text-xs px-2 py-0.5 rounded-full font-semibold cursor-pointer"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {(c.old_value || c.new_value) && (
                  <div className="text-xs text-stone-600 mb-2">
                    <span className="text-stone-400">{c.old_value || '—'}</span>
                    <span className="mx-2 text-stone-300">→</span>
                    <span className="font-medium text-stone-800">{c.new_value || '—'}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs text-stone-400">已通知：</span>
                  {AGENCIES.map((a) => {
                    const checked = (c.notified_agencies || []).includes(a)
                    return (
                      <label key={a} className="flex items-center gap-1 text-xs text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canEdit || updatingId === c.id}
                          onChange={() => handleAgencyToggle(c, a)}
                          className="w-3 h-3"
                        />
                        {a}
                      </label>
                    )
                  })}
                </div>

                {c.notified_at && (
                  <p className="text-[10px] text-stone-400 mt-1">通知於 {formatDate(c.notified_at)}</p>
                )}
                {c.notes && <p className="text-xs text-stone-500 mt-2">{c.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">記錄變更</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">變更類型</label>
                <select
                  value={form.changeType}
                  onChange={(e) => setForm((f) => ({ ...f, changeType: e.target.value }))}
                  className="input-base"
                >
                  {CHANGE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">原值</label>
                <input
                  value={form.oldValue}
                  onChange={(e) => setForm((f) => ({ ...f, oldValue: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">新值</label>
                <input
                  value={form.newValue}
                  onChange={(e) => setForm((f) => ({ ...f, newValue: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">備註</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-base resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={saving} className="flex-1 btn-primary">
                {saving ? '新增中...' : '確認新增'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50"
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
