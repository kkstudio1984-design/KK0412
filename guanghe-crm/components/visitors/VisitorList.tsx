'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface VisitorLog {
  id: string
  visitor_name: string
  visitor_phone: string | null
  visitor_company: string | null
  purpose: string
  host_client_id: string | null
  host_note: string | null
  check_in_time: string
  check_out_time: string | null
  notes: string | null
  host_client?: { organization: { name: string } | null } | null
}

interface Props {
  todayVisitors: VisitorLog[]
  insideCount: number
  history: VisitorLog[]
  clients: { id: string; name: string }[]
}

const PURPOSE_STYLES: Record<string, string> = {
  '洽公': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  '參觀': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '維修': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '送貨': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  '面試': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  '其他': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
}

export default function VisitorList({ todayVisitors: initialToday, insideCount: initialInside, history, clients }: Props) {
  const [todayVisitors, setTodayVisitors] = useState(initialToday)
  const [insideCount, setInsideCount] = useState(initialInside)
  const [showModal, setShowModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorCompany: '',
    purpose: '洽公',
    hostClientId: '',
    hostNote: '',
    notes: '',
  })

  const handleCheckIn = async () => {
    if (!form.visitorName.trim()) { toast.error('請填訪客姓名'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTodayVisitors([data, ...todayVisitors])
      setInsideCount(insideCount + 1)
      toast.success('已登記進場')
      setShowModal(false)
      setForm({ visitorName: '', visitorPhone: '', visitorCompany: '', purpose: '洽公', hostClientId: '', hostNote: '', notes: '' })
    } catch { toast.error('登記失敗') } finally { setAdding(false) }
  }

  const handleCheckOut = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOut: true }),
      })
      if (!res.ok) throw new Error()
      const now = new Date().toISOString()
      setTodayVisitors(vs => vs.map(v => v.id === id ? { ...v, check_out_time: now } : v))
      setInsideCount(Math.max(0, insideCount - 1))
      toast.success('已標記離場')
    } catch { toast.error('更新失敗') }
  }

  const duration = (inTime: string, outTime: string | null) => {
    const start = new Date(inTime)
    const end = outTime ? new Date(outTime) : new Date()
    const mins = Math.floor((end.getTime() - start.getTime()) / 60000)
    if (mins < 60) return `${mins} 分鐘`
    return `${Math.floor(mins / 60)} 小時 ${mins % 60} 分`
  }

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <p className="section-title mb-2">今日訪客</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: '#34d399' }}>{todayVisitors.length}</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>人次</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">目前在場</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: insideCount > 0 ? '#fbbf24' : '#888' }}>{insideCount}</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>位訪客</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">今日紀錄</h2>
        <CanEdit>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ 訪客進場</button>
        </CanEdit>
      </div>

      {todayVisitors.length === 0 ? (
        <EmptyState illustration="empty" title="今日尚無訪客" message="訪客抵達時點上方按鈕登記" />
      ) : (
        <div className="space-y-2">
          {todayVisitors.map(v => {
            const hostName = v.host_client?.organization?.name || v.host_note
            const inside = !v.check_out_time
            return (
              <div key={v.id} className="rounded-lg p-4" style={{ background: '#0a0a0a', border: '1px solid ' + (inside ? 'rgba(251,191,36,0.3)' : '#1f1f1f') }}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: inside ? 'rgba(251,191,36,0.2)' : '#1a1a1a', color: inside ? '#fbbf24' : '#888' }}>
                      {v.visitor_name[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{v.visitor_name}</span>
                        <span className={`badge ${PURPOSE_STYLES[v.purpose]}`}>{v.purpose}</span>
                        {inside && <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>● 在場</span>}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#888' }}>
                        {v.visitor_company && <span>{v.visitor_company} · </span>}
                        進場 {formatTime(v.check_in_time)}
                        {v.check_out_time && <span> · 離場 {formatTime(v.check_out_time)}</span>}
                        <span> · {duration(v.check_in_time, v.check_out_time)}</span>
                      </div>
                      {hostName && (
                        <p className="text-xs mt-0.5" style={{ color: '#9a9a9a' }}>拜訪：{hostName}</p>
                      )}
                    </div>
                  </div>
                  {inside && (
                    <CanEdit>
                      <button onClick={() => handleCheckOut(v.id)} className="btn-secondary text-xs px-3 py-1.5">標記離場</button>
                    </CanEdit>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      <div className="mt-8">
        <button onClick={() => setShowHistory(!showHistory)} className="text-sm font-semibold hover:text-white" style={{ color: '#888' }}>
          {showHistory ? '▾' : '▸'} 過去 7 天歷史（{history.length} 筆）
        </button>
        {showHistory && history.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {history.map(v => (
              <div key={v.id} className="flex items-center gap-2 p-2 rounded text-xs" style={{ background: '#0a0a0a' }}>
                <span className="tabular-nums shrink-0" style={{ color: '#666' }}>{new Date(v.check_in_time).toLocaleDateString('zh-TW')}</span>
                <span className="tabular-nums shrink-0" style={{ color: '#888' }}>{formatTime(v.check_in_time)}</span>
                <span className="text-white">{v.visitor_name}</span>
                <span className={`badge ${PURPOSE_STYLES[v.purpose]}`}>{v.purpose}</span>
                {v.host_client?.organization?.name && <span style={{ color: '#888' }}>→ {v.host_client.organization.name}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-96 max-h-[90vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">訪客進場登記</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>訪客姓名 *</label>
                <input value={form.visitorName} onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))} className="input-base" placeholder="王小明" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>電話</label>
                  <input value={form.visitorPhone} onChange={e => setForm(f => ({ ...f, visitorPhone: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>公司</label>
                  <input value={form.visitorCompany} onChange={e => setForm(f => ({ ...f, visitorCompany: e.target.value }))} className="input-base" />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>來訪目的</label>
                <select value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} className="input-base">
                  <option value="洽公">洽公</option>
                  <option value="參觀">參觀</option>
                  <option value="維修">維修</option>
                  <option value="送貨">送貨</option>
                  <option value="面試">面試</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>拜訪客戶（選填）</label>
                <select value={form.hostClientId} onChange={e => setForm(f => ({ ...f, hostClientId: e.target.value }))} className="input-base">
                  <option value="">無指定</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>拜訪對象備註</label>
                <input value={form.hostNote} onChange={e => setForm(f => ({ ...f, hostNote: e.target.value }))} className="input-base" placeholder="如：找陳小姐" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>備註</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base" style={{ resize: 'none' }} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCheckIn} disabled={adding} className="flex-1 btn-primary">{adding ? '登記中...' : '確認進場'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
