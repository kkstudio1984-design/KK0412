export const dynamic = 'force-dynamic'

import Link from 'next/link'
import KanbanBoard from '@/components/board/KanbanBoard'
import PageHeader from '@/components/ui/PageHeader'
import { CanEdit } from '@/components/providers/RoleProvider'
import { fetchClients } from '@/lib/queries'

export default async function BoardPage() {
  const clients = await fetchClients()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title="CRM 看板"
        subtitle="客戶進線管理・七階段追蹤"
        moduleColor="bg-amber-500"
        action={
          <CanEdit>
            <Link href="/clients/new" className="btn-primary">+ 新增客戶</Link>
          </CanEdit>
        }
      />

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <KanbanBoard initialClients={clients} />
      </div>
    </div>
  )
}
