'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { formatNTD } from '@/lib/utils'

interface AiTool {
  id: string; name: string; purpose: string | null; usedByModules: string[]
  costMonthly: number | null; status: string; createdAt: string
}

interface Props { initialTools: AiTool[] }

const STATUS_STYLES: Record<string, string> = {
  '使用中': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '評估中': 'text-amber-700 bg-amber-50 border-amber-200',
  '已棄用': 'text-stone-500 bg-stone-50 border-stone-200',
}

export default function AiToolList({ initialTools }: Props) {
  const [tools, setTools] = useState<AiTool[]>(initialTools)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', purpose: '', costMonthly: '', usedByModules: '' })

  const handleAdd = async () => {
    if (!form.name) { toast.error('請填寫工具名稱'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/ai-tools', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, purpose: form.purpose,
          usedByModules: form.usedByModules ? form.usedByModules.split('、').map(s => s.trim()) : [],
          costMonthly: form.costMonthly,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTools([{ id: data.id, name: data.name, purpose: data.purpose, usedByModules: data.used_by_modules || [], costMonthly: data.cost_monthly, status: data.status, createdAt: data.created_at }, ...tools])
      toast.success('工具已新增')
      setShowModal(false)
      setForm({ name: '', purpose: '', costMonthly: '', usedByModules: '' })
    } catch { toast.error('新增失敗') } finally { setAdding(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/ai-tools/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setTools(ts => ts.map(t => t.id === id ? { ...t, status } : t))
      toast.success('狀態已更新')
    } catch { toast.error('更新失敗') }
  }

  const totalCost = tools.filter(t => t.status === '使用中').reduce((sum, t) => sum + (t.costMonthly || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-stone-800">AI 工具清單</h2>
          <span className="text-xs text-stone-400">月成本 {formatNTD(totalCost)}</span>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-1.5">+ 新增工具</button>
      </div>

      {tools.length === 0 ? (
        <div className="card p-6 text-center"><p className="text-sm text-stone-300">尚無工具</p></div>
      ) : (
        <div className="space-y-2">
          {tools.map(tool => (
            <div key={tool.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-800">{tool.name}</p>
                {tool.purpose && <p className="text-xs text-stone-400 truncate">{tool.purpose}</p>}
                {tool.usedByModules.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {tool.usedByModules.map((m, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{m}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {tool.costMonthly && <span className="text-xs text-stone-500 tabular-nums">{formatNTD(tool.costMonthly)}/月</span>}
                <select value={tool.status} onChange={(e) => handleStatusChange(tool.id, e.target.value)}
                  className={`badge cursor-pointer ${STATUS_STYLES[tool.status] || ''}`}>
                  <option value="使用中">使用中</option>
                  <option value="評估中">評估中</option>
                  <option value="已棄用">已棄用</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增 AI 工具</h3>
            <div className="space-y-3">
              <div><label className="text-xs text-stone-500 mb-1 block">工具名稱</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="ChatGPT" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">用途</label>
                <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} className="input-base" placeholder="文案生成" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">月費（NT$）</label>
                <input type="number" value={form.costMonthly} onChange={e => setForm(f => ({ ...f, costMonthly: e.target.value }))} className="input-base" /></div>
              <div><label className="text-xs text-stone-500 mb-1 block">使用模組（用「、」分隔）</label>
                <input value={form.usedByModules} onChange={e => setForm(f => ({ ...f, usedByModules: e.target.value }))} className="input-base" placeholder="M2專案、M3銷售" /></div>
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
