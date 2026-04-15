'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClientDetail, SOURCES, Source } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  client: ClientDetail
}

export default function ClientInfo({ client }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    orgName: client.organization.name,
    taxId: client.organization.taxId ?? '',
    contactName: client.organization.contactName,
    contactPhone: client.organization.contactPhone ?? '',
    contactEmail: client.organization.contactEmail ?? '',
    contactLine: client.organization.contactLine ?? '',
    source: client.organization.source as Source,
    plan: client.plan ?? '',
    monthlyFee: String(client.monthlyFee),
    nextAction: client.nextAction ?? '',
    followUpDate: client.followUpDate ?? '',
    redFlags: client.redFlags.join('、'),
    notes: client.notes ?? '',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgName: form.orgName,
          taxId: form.taxId,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          contactLine: form.contactLine,
          source: form.source,
          plan: form.plan,
          monthlyFee: form.monthlyFee,
          nextAction: form.nextAction,
          followUpDate: form.followUpDate || null,
          redFlags: form.redFlags ? form.redFlags.split('、').map((s) => s.trim()).filter(Boolean) : [],
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('已儲存')
      setEditing(false)
    } catch {
      toast.error('儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'text-xs text-gray-500 mb-0.5 block'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">基本資料</h2>
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 text-slate-900 font-semibold px-4 py-1.5 rounded-lg shadow-sm"
            >
              {saving ? '儲存中...' : '儲存'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
            >
              取消
            </button>
          </div>
        ) : (
          <CanEdit>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 font-medium"
            >
              編輯
            </button>
          </CanEdit>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 公司名稱 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>公司名稱</label>
          {editing ? (
            <input className={inputCls} value={form.orgName} onChange={(e) => set('orgName', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{client.organization.name}</p>
          )}
        </div>

        {/* 統一編號 */}
        <div>
          <label className={labelCls}>統一編號</label>
          {editing ? (
            <input className={inputCls} value={form.taxId} onChange={(e) => set('taxId', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.organization.taxId ?? '—'}</p>
          )}
        </div>

        {/* 聯絡人 */}
        <div>
          <label className={labelCls}>聯絡人</label>
          {editing ? (
            <input className={inputCls} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-700">{client.organization.contactName}</p>
          )}
        </div>

        {/* 電話 */}
        <div>
          <label className={labelCls}>聯絡電話</label>
          {editing ? (
            <input className={inputCls} value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.organization.contactPhone ?? '—'}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className={labelCls}>Email</label>
          {editing ? (
            <input type="email" className={inputCls} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.organization.contactEmail ?? '—'}</p>
          )}
        </div>

        {/* LINE */}
        <div>
          <label className={labelCls}>LINE 帳號</label>
          {editing ? (
            <input className={inputCls} value={form.contactLine} onChange={(e) => set('contactLine', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.organization.contactLine ?? '—'}</p>
          )}
        </div>

        {/* 來源 */}
        <div>
          <label className={labelCls}>客戶來源</label>
          {editing ? (
            <select className={`${inputCls} bg-white`} value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <p className="text-sm text-gray-700">{client.organization.source}</p>
          )}
        </div>

        {/* 服務類型（唯讀） */}
        <div>
          <label className={labelCls}>服務類型</label>
          <p className="text-sm text-gray-700">{client.serviceType}</p>
        </div>

        {/* 方案 */}
        <div>
          <label className={labelCls}>方案名稱</label>
          {editing ? (
            <input className={inputCls} value={form.plan} onChange={(e) => set('plan', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.plan ?? '—'}</p>
          )}
        </div>

        {/* 月費 */}
        <div>
          <label className={labelCls}>月費</label>
          {editing ? (
            <input type="number" min="0" className={inputCls} value={form.monthlyFee} onChange={(e) => set('monthlyFee', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-700">NT${client.monthlyFee.toLocaleString()}</p>
          )}
        </div>

        {/* 下一步 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>下一步待辦</label>
          {editing ? (
            <input className={inputCls} value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.nextAction ?? '—'}</p>
          )}
        </div>

        {/* 跟進日期 */}
        <div>
          <label className={labelCls}>跟進日期</label>
          {editing ? (
            <input type="date" className={inputCls} value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-700">{formatDate(client.followUpDate)}</p>
          )}
        </div>

        {/* 紅旗 */}
        <div>
          <label className={labelCls}>紅旗原因（用「、」分隔）</label>
          {editing ? (
            <input className={inputCls} value={form.redFlags} onChange={(e) => set('redFlags', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{client.redFlags.length ? client.redFlags.join('、') : '—'}</p>
          )}
        </div>

        {/* 備註 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>備註</label>
          {editing ? (
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes ?? '—'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
