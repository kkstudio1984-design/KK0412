export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import KnowledgeEditor from '@/components/knowledge/KnowledgeEditor'

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase.from('knowledge_docs').select('*').eq('id', id).single()
  if (!doc) notFound()

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="編輯文件"
        subtitle={(doc as { title: string }).title}
        moduleColor="bg-violet-500"
        breadcrumbs={[
          { label: '內部知識庫', href: '/knowledge' },
          { label: (doc as { title: string }).title, href: `/knowledge/${id}` },
        ]}
      />
      <KnowledgeEditor initialDoc={doc as any} />
    </div>
  )
}
