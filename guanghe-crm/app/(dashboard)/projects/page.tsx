export const dynamic = 'force-dynamic'

import { fetchProjects } from '@/lib/queries'
import ProjectList from '@/components/projects/ProjectList'
import PageHeader from '@/components/ui/PageHeader'

export default async function ProjectsPage() {
  const projects = await fetchProjects()
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="專案管理"
        subtitle="AI影片・SEO配圖・社群經營・手心共影"
        moduleColor="bg-violet-500"
      />
      <ProjectList initialProjects={projects} />
    </div>
  )
}
