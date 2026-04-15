export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import KnowledgeList from '@/components/knowledge/KnowledgeList'
import { CanEdit } from '@/components/providers/RoleProvider'
import Link from 'next/link'

export default async function KnowledgePage() {
  const supabase = await createClient()

  const { data: docs } = await supabase
    .from('knowledge_docs')
    .select('id, title, category, tags, is_pinned, view_count, updated_at')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="內部知識庫"
        subtitle="SOP 流程、FAQ、合規規範"
        moduleColor="bg-violet-500"
        action={
          <CanEdit>
            <Link href="/knowledge/new" className="btn-primary">+ 新增文件</Link>
          </CanEdit>
        }
      />
      <KnowledgeList initialDocs={docs || []} />
    </div>
  )
}
