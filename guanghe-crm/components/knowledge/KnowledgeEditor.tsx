'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdownRaw from 'react-markdown'
import remarkGfm from 'remark-gfm'
const ReactMarkdown = ReactMarkdownRaw as unknown as React.FC<{ remarkPlugins?: unknown[]; children?: string }>
import toast from 'react-hot-toast'

interface Doc {
  id: string
  title: string
  category: string
  tags: string[]
  content: string
  is_pinned: boolean
}

interface Props { initialDoc?: Doc }

const CATEGORIES = ['SOP流程', 'FAQ常見問題', '政策規範', '合規法遵', '系統操作', '其他']

export default function KnowledgeEditor({ initialDoc }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialDoc?.title || '')
  const [category, setCategory] = useState(initialDoc?.category || 'SOP流程')
  const [tags, setTags] = useState<string[]>(initialDoc?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [content, setContent] = useState(initialDoc?.content || '# 文件標題\n\n內文...')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { toast.error('請填寫標題和內容'); return }
    setSaving(true)
    try {
      const url = initialDoc ? `/api/knowledge/${initialDoc.id}` : '/api/knowledge'
      const method = initialDoc ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, tags, content }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success('已儲存')
      router.push(`/knowledge/${initialDoc?.id || data.id}`)
    } catch { toast.error('儲存失敗') } finally { setSaving(false) }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  return (
    <div>
      {/* Meta */}
      <div className="card p-5 mb-4 space-y-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: '#888' }}>標題</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-base" placeholder="新客戶簽約 SOP" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#888' }}>分類</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input-base">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: '#888' }}>新增標籤（按 Enter）</label>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              className="input-base"
              placeholder="客戶"
            />
          </div>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="text-xs px-2 py-1 rounded inline-flex items-center gap-1" style={{ background: '#1a1a1a', color: '#fbbf24' }}>
                #{t}
                <button onClick={() => setTags(tags.filter(x => x !== t))} style={{ color: '#666' }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="card overflow-hidden">
        <div className="flex" style={{ borderBottom: '1px solid #222' }}>
          <button onClick={() => setPreview(false)} className="px-4 py-2 text-sm font-medium" style={{ background: !preview ? 'rgba(217,119,6,0.1)' : 'transparent', color: !preview ? '#fbbf24' : '#888', borderBottom: !preview ? '2px solid #d97706' : 'none' }}>
            ✏️ 編輯
          </button>
          <button onClick={() => setPreview(true)} className="px-4 py-2 text-sm font-medium" style={{ background: preview ? 'rgba(217,119,6,0.1)' : 'transparent', color: preview ? '#fbbf24' : '#888', borderBottom: preview ? '2px solid #d97706' : 'none' }}>
            👁 預覽
          </button>
        </div>

        {preview ? (
          <div className="p-6 prose-custom">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full p-5 text-sm outline-none"
            style={{ background: 'transparent', color: '#e8e6e3', fontFamily: 'ui-monospace, monospace', lineHeight: '1.6', minHeight: '500px', resize: 'vertical', border: 'none' }}
            placeholder="# 標題\n\n支援 Markdown：**粗體**、*斜體*、`代碼`、列表、表格、連結..."
          />
        )}
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? '儲存中...' : initialDoc ? '更新文件' : '建立文件'}
        </button>
        <button onClick={() => router.back()} className="btn-secondary">取消</button>
      </div>

      <p className="text-xs mt-4" style={{ color: '#666' }}>
        💡 支援 Markdown 語法：<code># 標題</code>、<code>**粗體**</code>、<code>- 列表</code>、<code>| 表格 |</code>
      </p>

      <style jsx global>{`
        .prose-custom h1 { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #222; }
        .prose-custom h2 { font-size: 1.35rem; font-weight: 700; color: #fff; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-custom h3 { font-size: 1.1rem; font-weight: 600; color: #e8e6e3; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-custom p { color: #c8c4be; line-height: 1.75; margin-bottom: 1rem; }
        .prose-custom ul, .prose-custom ol { margin: 1rem 0; padding-left: 1.5rem; color: #c8c4be; line-height: 1.75; }
        .prose-custom strong { color: #fff; font-weight: 600; }
        .prose-custom em { color: #fbbf24; font-style: normal; }
        .prose-custom code { background: #1a1a1a; color: #fbbf24; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; font-family: ui-monospace, monospace; }
        .prose-custom pre { background: #0a0a0a; border: 1px solid #222; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .prose-custom pre code { background: transparent; padding: 0; color: #e8e6e3; }
        .prose-custom table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; }
        .prose-custom th { background: #0a0a0a; color: #888; font-weight: 600; padding: 0.6rem; text-align: left; border: 1px solid #222; }
        .prose-custom td { padding: 0.6rem; border: 1px solid #1f1f1f; color: #c8c4be; }
      `}</style>
    </div>
  )
}
