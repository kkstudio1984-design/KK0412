'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Lead, LEAD_CHANNELS, LEAD_INTERESTS, LeadChannel, LeadInterest } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  lead: Lead
}

export default function LeadInfo({ lead }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    contactName: lead.contactName,
    contactInfo: lead.contactInfo ?? '',
    channel: lead.channel as string,
    interest: lead.interest as string,
    followUpDate: lead.followUpDate ?? '',
    notes: lead.notes ?? '',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: form.contactName,
          contactInfo: form.contactInfo || null,
          channel: form.channel,
          interest: form.interest,
          followUpDate: form.followUpDate || null,
          notes: form.notes || null,
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
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 font-medium"
          >
            編輯
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 聯絡人姓名 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>聯絡人姓名</label>
          {editing ? (
            <input className={inputCls} value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-900 font-medium">{lead.contactName}</p>
          )}
        </div>

        {/* 聯絡方式 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>聯絡方式</label>
          {editing ? (
            <input className={inputCls} value={form.contactInfo} onChange={(e) => set('contactInfo', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700">{lead.contactInfo ?? '—'}</p>
          )}
        </div>

        {/* 來源管道 */}
        <div>
          <label className={labelCls}>來源管道</label>
          {editing ? (
            <select className={`${inputCls} bg-white`} value={form.channel} onChange={(e) => set('channel', e.target.value)}>
              {LEAD_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          ) : (
            <p className="text-sm text-gray-700">{lead.channel}</p>
          )}
        </div>

        {/* 需求興趣 */}
        <div>
          <label className={labelCls}>需求興趣</label>
          {editing ? (
            <select className={`${inputCls} bg-white`} value={form.interest} onChange={(e) => set('interest', e.target.value)}>
              {LEAD_INTERESTS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          ) : (
            <p className="text-sm text-gray-700">{lead.interest}</p>
          )}
        </div>

        {/* 跟進日期 */}
        <div>
          <label className={labelCls}>跟進日期</label>
          {editing ? (
            <input type="date" className={inputCls} value={form.followUpDate} onChange={(e) => set('followUpDate', e.target.value)} />
          ) : (
            <p className="text-sm text-gray-700">{formatDate(lead.followUpDate)}</p>
          )}
        </div>

        {/* 備註 */}
        <div className="sm:col-span-2">
          <label className={labelCls}>備註</label>
          {editing ? (
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="—" />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes ?? '—'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
