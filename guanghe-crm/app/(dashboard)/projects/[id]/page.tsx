export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { fetchProject } from '@/lib/queries'
import { formatDate, formatNTD } from '@/lib/utils'
import TaskList from '@/components/projects/TaskList'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await fetchProject(id)
  if (!project) notFound()

  const STATUS_STYLES: Record<string, string> = {
    '洽談中': 'text-stone-600 bg-stone-50 border-stone-200',
    '進行中': 'text-blue-700 bg-blue-50 border-blue-200',
    '待驗收': 'text-amber-700 bg-amber-50 border-amber-200',
    '已結案': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    '已取消': 'text-red-700 bg-red-50 border-red-200',
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/projects" className="text-stone-400 hover:text-stone-600 text-sm">&larr; 專案管理</a>
        <span className="text-stone-300">/</span>
        <h1 className="text-lg font-bold text-stone-800 truncate">{project.name}</h1>
        <span className={`badge shrink-0 ${STATUS_STYLES[project.status] || ''}`}>{project.status}</span>
      </div>

      {/* Project info */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-stone-800 mb-4">專案資訊</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-stone-400 block mb-0.5">委託客戶</span>
            <span className="text-stone-700">{(project.organization as any)?.name || '—'}</span>
          </div>
          <div>
            <span className="text-xs text-stone-400 block mb-0.5">專案類型</span>
            <span className="text-stone-700">{project.projectType}</span>
          </div>
          <div>
            <span className="text-xs text-stone-400 block mb-0.5">預算</span>
            <span className="text-stone-700">{formatNTD(project.budget)}</span>
          </div>
          <div>
            <span className="text-xs text-stone-400 block mb-0.5">截止日期</span>
            <span className="text-stone-700">{project.deadline ? formatDate(project.deadline) : '—'}</span>
          </div>
          {project.notes && (
            <div className="col-span-2">
              <span className="text-xs text-stone-400 block mb-0.5">備註</span>
              <span className="text-stone-700">{project.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <TaskList projectId={project.id} initialTasks={project.tasks || []} />
    </div>
  )
}
