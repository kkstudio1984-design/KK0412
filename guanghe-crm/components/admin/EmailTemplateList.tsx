'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import EmptyState from '@/components/ui/EmptyState'

interface Template {
  id: string
  name: string
  template_key: string
  category: string
  subject: string
  body: string
  variables: string[]
  description: string | null
  is_active: boolean
}

interface Props { initialTemplates: Template[] }

const CATEGORY_STYLES: Record<string, string> = {
  '客戶': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  '收款': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '合約': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'KYC': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  '退場': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '通用': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
  '其他': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
}

export default function EmailTemplateList({ initialTemplates }: Props) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    name: '', templateKey: '', category: '通用', subject: '', body: '', description: '',
  })

  const handleCreate = async () => {
    if (!form.name || !form.templateKey || !form.subject || !form.body) {
      toast.error('請填寫所有必要欄位')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTemplates([...templates, data])
      toast.success('範本已建立')
      setShowCreate(false)
      setForm({ name: '', templateKey: '', category: '通用', subject: '', body: '', description: '' })
    } catch { toast.error('建立失敗') } finally { setBusy(false) }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/email-templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (!res.ok) throw new Error()
      setTemplates(ts => ts.map(t => t.id === id ? { ...t, is_active: !isActive } : t))
      toast.success(!isActive ? '已啟用' : '已停用')
    } catch { toast.error('更新失敗') }
  }

  const byCategory: Record<string, Template[]> = {}
  for (const t of templates) {
    if (!byCategory[t.category]) byCategory[t.category] = []
    byCategory[t.category].push(t)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#888' }}>共 {templates.length} 個範本</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-xs">+ 新增範本</button>
      </div>

      {templates.length === 0 ? (
        <EmptyState illustration="documents" title="尚無範本" message="建立 Email 範本以快速寄送通知" />
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, list]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${CATEGORY_STYLES[cat]}`}>{cat}</span>
                <span className="text-xs" style={{ color: '#666' }}>{list.length} 個範本</span>
              </div>
              <div className="space-y-2">
                {list.map(t => (
                  <div key={t.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-white">{t.name}</p>
                          {!t.is_active && <span className="text-xs" style={{ color: '#666' }}>（停用）</span>}
                        </div>
                        <p className="text-xs font-mono mb-1" style={{ color: '#666' }}>{t.template_key}</p>
                        <p className="text-xs truncate" style={{ color: '#9a9a9a' }}>{t.subject}</p>
                        {t.description && <p className="text-xs mt-1" style={{ color: '#666' }}>{t.description}</p>}
                        {t.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {t.variables.map((v, i) => (
                              <span key={i} className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#fbbf24' }}>{v}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={`/admin/email-templates/${t.id}`} className="btn-secondary text-xs">編輯</Link>
                        <button onClick={() => toggleActive(t.id, t.is_active)} className="text-xs px-2 py-1 rounded" style={{ background: '#1a1a1a', color: t.is_active ? '#fbbf24' : '#888', border: '1px solid #2a2a2a' }}>
                          {t.is_active ? '停用' : '啟用'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCreate(false)}>
          <div className="rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">新增 Email 範本</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>範本名稱</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="繳款通知" />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>範本 key</label>
                  <input value={form.templateKey} onChange={e => setForm(f => ({ ...f, templateKey: e.target.value }))} className="input-base" placeholder="payment_reminder" style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>分類</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                  <option value="客戶">客戶</option>
                  <option value="收款">收款</option>
                  <option value="合約">合約</option>
                  <option value="KYC">KYC</option>
                  <option value="退場">退場</option>
                  <option value="通用">通用</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>主旨</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input-base" placeholder="【光合創學】{{client_name}} 繳款通知" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>內文（支援 {'{{'}變數{'}}'})</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="input-base" rows={10} style={{ fontFamily: 'system-ui', resize: 'vertical' }} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>說明（選填）</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base" />
              </div>
              <p className="text-xs p-3 rounded-lg" style={{ background: 'rgba(217,119,6,0.1)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.2)' }}>
                💡 可用變數會從內文中自動抓取。例如寫入 <code>{'{{client_name}}'}</code>、<code>{'{{amount}}'}</code>
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} disabled={busy} className="flex-1 btn-primary">確認建立</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
