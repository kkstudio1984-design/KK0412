'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Project, ProjectType, PROJECT_TYPES, PROJECT_STATUSES } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  initialProjects: Project[]
}

const STATUS_STYLES: Record<string, string> = {
  '洽談中': 'text-stone-600 bg-stone-50 border-stone-200',
  '進行中': 'text-blue-700 bg-blue-50 border-blue-200',
  '待驗收': 'text-amber-700 bg-amber-50 border-amber-200',
  '已結案': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '已取消': 'text-red-700 bg-red-50 border-red-200',
}

const TYPE_STYLES: Record<string, string> = {
  'AI影片': 'text-purple-700 bg-purple-50 border-purple-200',
  'SEO配圖': 'text-sky-700 bg-sky-50 border-sky-200',
  '社群經營': 'text-pink-700 bg-pink-50 border-pink-200',
  '手心共影': 'text-amber-700 bg-amber-50 border-amber-200',
}

export default function ProjectList({ initialProjects }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    orgId: '',
    name: '',
    projectType: 'AI影片' as ProjectType,
    budget: '',
    startDate: '',
    deadline: '',
    notes: '',
  })

  const handleAdd = async () => {
    if (!form.orgId || !form.name) { toast.error('請填寫客戶 ID 和專案名稱'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: Project = {
        id: data.id,
        orgId: data.org_id,
        name: data.name,
        projectType: data.project_type,
        status: data.status,
        budget: data.budget,
        startDate: data.start_date,
        deadline: data.deadline,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        organization: data.organization ? { id: data.organization.id, name: data.organization.name } as any : undefined,
        tasks: [],
      }
      setProjects([mapped, ...projects])
      toast.success('專案已建立')
      setShowModal(false)
      setForm({ orgId: '', name: '', projectType: 'AI影片', budget: '', startDate: '', deadline: '', notes: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const activeCount = projects.filter(p => ['洽談中', '進行中', '待驗收'].includes(p.status)).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">共 {projects.length} 個專案，{activeCount} 個進行中</p>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ 新增專案</button>
      </div>

      {projects.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-sm text-stone-300">尚無專案</p></div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const tasksDone = (p.tasks || []).filter((t: any) => t.status === '完成').length
            const tasksTotal = (p.tasks || []).length
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 block hover:border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-stone-800">{p.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${TYPE_STYLES[p.projectType] || ''}`}>{p.projectType}</span>
                    <span className={`badge ${STATUS_STYLES[p.status] || ''}`}>{p.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span>{(p.organization as any)?.name || '未知客戶'}</span>
                  <span>預算 {formatNTD(p.budget)}</span>
                  {p.deadline && <span>截止 {formatDate(p.deadline)}</span>}
                  {tasksTotal > 0 && <span>任務 {tasksDone}/{tasksTotal}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-stone-800 mb-4">新增專案</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">委託客戶 Organization ID</label>
                <input value={form.orgId} onChange={(e) => setForm(f => ({ ...f, orgId: e.target.value }))} className="input-base" placeholder="組織 UUID" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">專案名稱</label>
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="ESG 形象影片製作" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">專案類型</label>
                <select value={form.projectType} onChange={(e) => setForm(f => ({ ...f, projectType: e.target.value as ProjectType }))} className="input-base">
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">預算（NT$）</label>
                <input type="number" min="0" value={form.budget} onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">開始日期</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">截止日期</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} className="input-base" />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">備註</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="input-base resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">{adding ? '建立中...' : '確認建立'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
