export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import KnowledgeDocView from '@/components/knowledge/KnowledgeDocView'

export default async function KnowledgeDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('knowledge_docs')
    .select('*, creator:profiles!created_by(name), updater:profiles!updated_by(name)')
    .eq('id', id)
    .single()

  if (!doc) notFound()

  // Increment view count (fire and forget)
  supabase.from('knowledge_docs').update({ view_count: (doc as { view_count: number }).view_count + 1 }).eq('id', id).then(() => {})

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <PageHeader
        title={(doc as { title: string }).title}
        subtitle={(doc as { category: string }).category}
        moduleColor="bg-violet-500"
        breadcrumbs={[{ label: '內部知識庫', href: '/knowledge' }]}
      />
      <KnowledgeDocView doc={doc as any} />
    </div>
  )
}
