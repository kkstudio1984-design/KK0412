'use client'

import ReactMarkdownRaw from 'react-markdown'
import remarkGfm from 'remark-gfm'
// Cast to bypass React 18 vs 19 type mismatch
const ReactMarkdown = ReactMarkdownRaw as unknown as React.FC<{ remarkPlugins?: unknown[]; children?: string }>
import Link from 'next/link'
import { CanEdit, useRole } from '@/components/providers/RoleProvider'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Doc {
  id: string
  title: string
  category: string
  tags: string[]
  content: string
  is_pinned: boolean
  view_count: number
  updated_at: string
  creator?: { name: string } | null
  updater?: { name: string } | null
}

interface Props { doc: Doc }

export default function KnowledgeDocView({ doc }: Props) {
  const router = useRouter()
  const { isAdmin } = useRole()

  const handleDelete = async () => {
    if (!confirm(`確定刪除「${doc.title}」？`)) return
    try {
      const res = await fetch(`/api/knowledge/${doc.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('已刪除')
      router.push('/knowledge')
    } catch { toast.error('刪除失敗') }
  }

  const togglePin = async () => {
    try {
      const res = await fetch(`/api/knowledge/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !doc.is_pinned }),
      })
      if (!res.ok) throw new Error()
      toast.success(doc.is_pinned ? '已取消置頂' : '已置頂')
      router.refresh()
    } catch { toast.error('更新失敗') }
  }

  return (
    <div>
      {/* Meta + actions */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex-1 min-w-0">
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {doc.tags.map((t, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888' }}>#{t}</span>
              ))}
            </div>
          )}
          <p className="text-xs" style={{ color: '#666' }}>
            {doc.updater ? `${doc.updater.name} 更新於` : '更新於'} {formatDate(doc.updated_at)} · 瀏覽 {doc.view_count} 次
            {doc.is_pinned && <span className="ml-2" style={{ color: '#fbbf24' }}>📌 置頂中</span>}
          </p>
        </div>
        <CanEdit>
          <div className="flex gap-2">
            <button onClick={togglePin} className="btn-secondary text-xs">
              {doc.is_pinned ? '取消置頂' : '📌 置頂'}
            </button>
            <Link href={`/knowledge/${doc.id}/edit`} className="btn-secondary text-xs">編輯</Link>
            {isAdmin && (
              <button onClick={handleDelete} className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                刪除
              </button>
            )}
          </div>
        </CanEdit>
      </div>

      {/* Markdown content */}
      <article className="card p-8">
        <div className="prose-custom">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
        </div>
      </article>

      <style jsx global>{`
        .prose-custom h1 { font-size: 1.75rem; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #222; }
        .prose-custom h2 { font-size: 1.35rem; font-weight: 700; color: #fff; margin-top: 2rem; margin-bottom: 0.75rem; }
        .prose-custom h3 { font-size: 1.1rem; font-weight: 600; color: #e8e6e3; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .prose-custom p { color: #c8c4be; line-height: 1.75; margin-bottom: 1rem; }
        .prose-custom ul, .prose-custom ol { margin: 1rem 0; padding-left: 1.5rem; color: #c8c4be; line-height: 1.75; }
        .prose-custom li { margin-bottom: 0.25rem; }
        .prose-custom ul li::marker { color: #fbbf24; }
        .prose-custom ol li::marker { color: #fbbf24; font-weight: 600; }
        .prose-custom strong { color: #fff; font-weight: 600; }
        .prose-custom em { color: #fbbf24; font-style: normal; }
        .prose-custom a { color: #38bdf8; text-decoration: underline; }
        .prose-custom code { background: #1a1a1a; color: #fbbf24; padding: 0.1rem 0.4rem; border-radius: 0.25rem; font-size: 0.875em; font-family: ui-monospace, monospace; }
        .prose-custom pre { background: #0a0a0a; border: 1px solid #222; border-radius: 0.5rem; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
        .prose-custom pre code { background: transparent; padding: 0; color: #e8e6e3; }
        .prose-custom blockquote { border-left: 3px solid #d97706; padding-left: 1rem; margin: 1rem 0; color: #9a9a9a; font-style: italic; }
        .prose-custom table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9em; }
        .prose-custom th { background: #0a0a0a; color: #888; font-weight: 600; padding: 0.6rem; text-align: left; border: 1px solid #222; }
        .prose-custom td { padding: 0.6rem; border: 1px solid #1f1f1f; color: #c8c4be; }
        .prose-custom hr { border: none; border-top: 1px solid #222; margin: 2rem 0; }
      `}</style>
    </div>
  )
}
