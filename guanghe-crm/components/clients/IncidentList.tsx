'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit } from '@/components/providers/RoleProvider'
import { formatDate } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

interface Incident {
  id: string
  space_client_id: string
  incident_type: string
  severity: string
  title: string
  description: string | null
  occurred_at: string
  status: string
  resolution: string | null
  resolved_at: string | null
  reporter?: { name: string } | null
  resolver?: { name: string } | null
}

interface Props {
  clientId: string
  initialIncidents: Incident[]
}

const TYPE_COLORS: Record<string, string> = {
  '客訴': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '糾紛': 'text-red-400 bg-red-500/10 border-red-500/20',
  '警示事件': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  '異常狀況': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '其他': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
}

const SEVERITY_COLORS: Record<string, string> = {
  '低': '#9a9a9a',
  '中': '#fbbf24',
  '高': '#fb923c',
  '緊急': '#ef4444',
}

const STATUS_COLORS: Record<string, string> = {
  '處理中': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  '已解決': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '已結案': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  '已撤回': 'text-stone-500 bg-stone-500/5 border-stone-500/10',
}

export default function IncidentList({ clientId, initialIncidents }: Props) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [form, setForm] = useState({
    incidentType: '客訴', severity: '中', title: '', description: '',
    occurredAt: new Date().toISOString().slice(0, 16),
  })

  const handleAdd = async () => {
    if (!form.title) { toast.error('請填寫標題'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/incidents`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, occurredAt: new Date(form.occurredAt).toISOString() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIncidents([data, ...incidents])
      toast.success('事件已記錄')
      setShowModal(false)
      setForm({ incidentType: '客訴', severity: '中', title: '', description: '', occurredAt: new Date().toISOString().slice(0, 16) })
    } catch { toast.error('新增失敗') } finally { setAdding(false) }
  }

  const handleStatusChange = async (incidentId: string, status: string) => {
    setUpdating(incidentId)
    try {
      const res = await fetch(`/api/clients/${clientId}/incidents/${incidentId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setIncidents(is => is.map(i => i.id === incidentId ? { ...i, status, resolved_at: status === '已解決' || status === '已結案' ? new Date().toISOString() : i.resolved_at } : i))
      toast.success('狀態已更新')
    } catch { toast.error('更新失敗') } finally { setUpdating(null) }
  }

  const openCount = incidents.filter(i => i.status === '處理中').length

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">客訴與事件紀錄</h2>
          {openCount > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              {openCount} 處理中
            </span>
          )}
        </div>
        <CanEdit>
          <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-1.5">+ 新增事件</button>
        </CanEdit>
      </div>

      {incidents.length === 0 ? (
        <EmptyState illustration="empty" title="尚無事件紀錄" message="記錄客訴、糾紛、警示事件以便後續追蹤" />
      ) : (
        <div className="space-y-3">
          {incidents.map(inc => {
            const isOpen = expanded === inc.id
            return (
              <div key={inc.id} className="rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #1f1f1f' }}>
                <button onClick={() => setExpanded(isOpen ? null : inc.id)} className="w-full text-left p-3.5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[inc.severity] }} />
                    <span className={`badge ${TYPE_COLORS[inc.incident_type] || ''}`}>{inc.incident_type}</span>
                    <span className={`badge ${STATUS_COLORS[inc.status] || ''}`}>{inc.status}</span>
                    <span className="text-xs ml-auto" style={{ color: '#888' }}>{formatDate(inc.occurred_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{inc.title}</p>
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-2 space-y-3" style={{ borderTop: '1px solid #1f1f1f' }}>
                    {inc.description && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#666' }}>詳細說明</p>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#c8c4be' }}>{inc.description}</p>
                      </div>
                    )}
                    {inc.resolution && (
                      <div>
                        <p className="text-xs mb-1" style={{ color: '#666' }}>處理結果</p>
                        <p className="text-sm whitespace-pre-wrap" style={{ color: '#c8c4be' }}>{inc.resolution}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#666' }}>
                      <span>通報：{inc.reporter?.name || '—'}</span>
                      {inc.resolver && <span>· 處理：{inc.resolver.name}</span>}
                      {inc.resolved_at && <span>· 解決於 {formatDate(inc.resolved_at)}</span>}
                    </div>
                    <CanEdit>
                      <div className="flex gap-2">
                        {inc.status === '處理中' && (
                          <>
                            <button onClick={() => handleStatusChange(inc.id, '已解決')} disabled={updating === inc.id} className="btn-primary text-xs px-3 py-1">標記已解決</button>
                            <button onClick={() => handleStatusChange(inc.id, '已撤回')} disabled={updating === inc.id} className="btn-secondary text-xs px-3 py-1">撤回</button>
                          </>
                        )}
                        {inc.status === '已解決' && (
                          <button onClick={() => handleStatusChange(inc.id, '已結案')} disabled={updating === inc.id} className="btn-primary text-xs px-3 py-1">結案</button>
                        )}
                      </div>
                    </CanEdit>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">新增事件紀錄</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>事件類型</label>
                <select value={form.incidentType} onChange={e => setForm(f => ({ ...f, incidentType: e.target.value }))} className="input-base">
                  <option value="客訴">客訴</option>
                  <option value="糾紛">糾紛</option>
                  <option value="警示事件">警示事件</option>
                  <option value="異常狀況">異常狀況</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>嚴重程度</label>
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="input-base">
                  <option value="低">低</option>
                  <option value="中">中</option>
                  <option value="高">高</option>
                  <option value="緊急">緊急</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>發生時間</label>
                <input type="datetime-local" value={form.occurredAt} onChange={e => setForm(f => ({ ...f, occurredAt: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>標題</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="簡述事件" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>詳細說明</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" style={{ resize: 'none' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">{adding ? '新增中...' : '確認新增'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
