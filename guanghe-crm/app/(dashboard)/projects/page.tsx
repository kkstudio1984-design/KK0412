export const dynamic = 'force-dynamic'

import { fetchProjects } from '@/lib/queries'
import ProjectList from '@/components/projects/ProjectList'

export default async function ProjectsPage() {
  const projects = await fetchProjects()
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-stone-800">專案管理</h1>
          <p className="text-xs text-stone-400 mt-0.5">四條業務線：AI影片・SEO配圖・社群經營・手心共影</p>
        </div>
      </div>
      <ProjectList initialProjects={projects} />
    </div>
  )
}
