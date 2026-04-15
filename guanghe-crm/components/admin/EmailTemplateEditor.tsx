'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  template_key: string
  category: string
  subject: string
  body: string
  variables: string[]
  description: string | null
}

interface Props { template: Template }

// Sample data for preview
const SAMPLE_DATA: Record<string, string> = {
  '{{client_name}}': '測試科技有限公司',
  '{{contact_name}}': '王小明',
  '{{service_type}}': '借址登記',
  '{{plan}}': '一般方案',
  '{{monthly_fee}}': '2,500',
  '{{amount}}': '2,500',
  '{{due_date}}': '2026/05/01',
  '{{overdue_days}}': '15',
  '{{deadline}}': '2026/05/15',
  '{{contract_type}}': '借址登記',
  '{{end_date}}': '2027/06/30',
  '{{days_left}}': '30',
  '{{last_verified}}': '2025/04/15',
  '{{migration_deadline}}': '2027/07/30',
  '{{missing_documents}}': '1. 負責人雙證件影本\n2. 股東名冊',
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[\w_]+\}\}/g) || []
  return Array.from(new Set(matches))
}

function substitute(text: string, data: Record<string, string>): string {
  let result = text
  for (const [k, v] of Object.entries(data)) {
    result = result.split(k).join(v)
  }
  return result
}

export default function EmailTemplateEditor({ template }: Props) {
  const router = useRouter()
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [description, setDescription] = useState(template.description || '')
  const [saving, setSaving] = useState(false)

  const extractedVars = useMemo(() => extractVariables(subject + ' ' + body), [subject, body])
  const previewSubject = useMemo(() => substitute(subject, SAMPLE_DATA), [subject])
  const previewBody = useMemo(() => substitute(body, SAMPLE_DATA), [body])

  const copyToClipboard = () => {
    const full = `主旨：${previewSubject}\n\n${previewBody}`
    navigator.clipboard.writeText(full)
    toast.success('已複製主旨與內文到剪貼簿')
  }

  const copySubject = () => {
    navigator.clipboard.writeText(previewSubject)
    toast.success('已複製主旨')
  }

  const copyBody = () => {
    navigator.clipboard.writeText(previewBody)
    toast.success('已複製內文')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body, description, variables: extractedVars }),
      })
      if (!res.ok) throw new Error()
      toast.success('已儲存')
      router.refresh()
    } catch { toast.error('儲存失敗') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm('確定要刪除此範本？')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/email-templates/${template.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('已刪除')
      router.push('/admin/email-templates')
    } catch { toast.error('刪除失敗') } finally { setSaving(false) }
  }

  const insertVar = (varName: string) => {
    setBody(b => b + varName)
  }

  return (
    <div>
      {/* Meta info */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs mb-1" style={{ color: '#666' }}>範本 key</p>
            <p className="font-mono text-white">{template.template_key}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#666' }}>分類</p>
            <p className="text-white">{template.category}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#666' }}>偵測到的變數</p>
            <p className="text-white">{extractedVars.length} 個</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="card p-5 space-y-3">
          <p className="section-title">編輯</p>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#888' }}>主旨</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#888' }}>內文</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="input-base" rows={14} style={{ fontFamily: 'system-ui', resize: 'vertical', lineHeight: '1.6' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#888' }}>說明</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-base" placeholder="何時使用此範本" />
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: '#888' }}>快速插入變數</p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(SAMPLE_DATA).map(v => (
                <button key={v} onClick={() => insertVar(v)} className="text-xs font-mono px-2 py-1 rounded hover:bg-amber-500/20" style={{ background: '#1a1a1a', color: '#fbbf24', border: '1px solid #2a2a2a' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">{saving ? '儲存中...' : '儲存'}</button>
            <button onClick={handleDelete} disabled={saving} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
              刪除
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="section-title">預覽</p>
            <button onClick={copyToClipboard} className="text-xs px-2 py-1 rounded" style={{ background: '#1a1a1a', color: '#fbbf24' }}>
              📋 複製全部
            </button>
          </div>

          <div className="rounded-lg p-4" style={{ background: '#0a0a0a', border: '1px solid #1f1f1f' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: '#666' }}>主旨</p>
              <button onClick={copySubject} className="text-xs" style={{ color: '#888' }}>📋</button>
            </div>
            <p className="font-semibold text-white mb-3 pb-3" style={{ borderBottom: '1px solid #1f1f1f' }}>{previewSubject}</p>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs" style={{ color: '#666' }}>內文</p>
              <button onClick={copyBody} className="text-xs" style={{ color: '#888' }}>📋</button>
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#c8c4be', lineHeight: '1.7' }}>{previewBody}</p>
          </div>

          <p className="text-xs mt-3" style={{ color: '#666' }}>
            💡 預覽使用範例資料。實際寄送時會從客戶資料自動代入。
          </p>
        </div>
      </div>
    </div>
  )
}
