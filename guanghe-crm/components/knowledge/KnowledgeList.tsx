'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'

interface Doc {
  id: string
  title: string
  category: string
  tags: string[]
  is_pinned: boolean
  view_count: number
  updated_at: string
}

interface Props { initialDocs: Doc[] }

const CATEGORY_STYLES: Record<string, string> = {
  'SOP流程': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'FAQ常見問題': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  '政策規範': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '合規法遵': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '系統操作': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '其他': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
}

const CATEGORIES = ['全部', 'SOP流程', 'FAQ常見問題', '政策規範', '合規法遵', '系統操作', '其他']

export default function KnowledgeList({ initialDocs }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')

  const filtered = useMemo(() => {
    let list = initialDocs
    if (category !== '全部') list = list.filter(d => d.category === category)
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(d =>
        d.title.toLowerCase().includes(s) ||
        d.tags.some(t => t.toLowerCase().includes(s))
      )
    }
    return list
  }, [initialDocs, search, category])

  const pinned = filtered.filter(d => d.is_pinned)
  const rest = filtered.filter(d => !d.is_pinned)

  return (
    <div>
      {/* Search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜尋文件標題或標籤..."
          className="input-base w-full md:w-80"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: category === c ? 'rgba(217,119,6,0.2)' : '#1a1a1a',
                color: category === c ? '#fbbf24' : '#888',
                border: `1px solid ${category === c ? 'rgba(217,119,6,0.3)' : '#2a2a2a'}`,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState illustration="documents" title="無符合文件" message="試試其他關鍵字或分類" />
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#fbbf24' }}>📌 置頂</p>
              <div className="space-y-2">
                {pinned.map(d => <DocCard key={d.id} doc={d} />)}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              <div className="space-y-2">
                {rest.map(d => <DocCard key={d.id} doc={d} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DocCard({ doc }: { doc: Doc }) {
  return (
    <Link href={`/knowledge/${doc.id}`} className="card p-4 block">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-white">{doc.title}</h3>
            <span className={`badge ${CATEGORY_STYLES[doc.category] || ''}`}>{doc.category}</span>
          </div>
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {doc.tags.map((t, i) => (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888' }}>#{t}</span>
              ))}
            </div>
          )}
          <p className="text-xs" style={{ color: '#666' }}>
            更新於 {formatDate(doc.updated_at)} · 瀏覽 {doc.view_count} 次
          </p>
        </div>
      </div>
    </Link>
  )
}
