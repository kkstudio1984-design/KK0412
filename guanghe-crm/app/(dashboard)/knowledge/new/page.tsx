import PageHeader from '@/components/ui/PageHeader'
import KnowledgeEditor from '@/components/knowledge/KnowledgeEditor'

export default function NewKnowledgePage() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="新增文件"
        subtitle="建立 SOP、FAQ 或其他內部文件"
        moduleColor="bg-violet-500"
        breadcrumbs={[{ label: '內部知識庫', href: '/knowledge' }]}
      />
      <KnowledgeEditor />
    </div>
  )
}
