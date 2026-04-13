'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Agent {
  id: string; name: string; purpose: string | null; targetModule: string | null
  promptVersion: string | null; lastUpdated: string | null; performanceNotes: string | null; createdAt: string
}

interface Props { initialAgents: Agent[] }

export default function AgentList({ initialAgents }: Props) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', purpose: '', targetModule: '', promptVersion: 'v1.0' })

  const handleAdd = async () => {
    if (!form.name) { toast.error('請填寫 Agent 名稱'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAgents([{ id: data.id, name: data.name, purpose: data.purpose, targetModule: data.target_module, promptVersion: data.prompt_version, lastUpdated: data.last_updated, performanceNotes: data.performance_notes, createdAt: data.created_at }, ...agents])
      toast.success('Agent 已新增')
      setShowModal(false)
      setForm({ name: '', purpose: '', targetModule: '', promptVersion: 'v1.0' })
    } catch { toast.error('新增失敗') } finally { setAdding(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-800">Agent 管理</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-1.5">+ 新增 Agent</button>
      </div>

      {agents.length === 0 ? (
        <div className="card p-6 text-center"><p className="text-sm text-stone-300">尚無 Agent</p></div>
      ) : (
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="card p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-stone-800">{agent.name}</p>
                <div className="flex items-center gap-2">
                  {agent.promptVersion && <span className="badge text-purple-700 bg-purple-50 border-purple-200">{agent.promptVersion}</span>}
                  {agent.targetModule && <span className="badge text-sky-700 bg-sky-50 border-sky-200">{agent.targetModule}</span>}
                </div>
              </div>
              {agent.purpose && <p className="text-xs text-stone-400">{agent.purpose}</p>}
              {agent.lastUpdated && <p className="text-xs text-stone-300 mt-1">更新：{formatDate(agent.lastUpdated)}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增 Agent</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-stone-500 mb-1 block">名稱</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="客服 Agent" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">用途</label>
                <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} className="input-base" placeholder="自動回覆客戶常見問題" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">目標模組</label>
                <input value={form.targetModule} onChange={e => setForm(f => ({ ...f, targetModule: e.target.value }))} className="input-base" placeholder="M1空間" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">Prompt 版本</label>
                <input value={form.promptVersion} onChange={e => setForm(f => ({ ...f, promptVersion: e.target.value }))} className="input-base" /></div>
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
