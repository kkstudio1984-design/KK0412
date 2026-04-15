export const dynamic = 'force-dynamic'

import Link from 'next/link'
import LeadPipelineBoard from '@/components/leads/LeadPipelineBoard'
import PageHeader from '@/components/ui/PageHeader'
import { CanEdit } from '@/components/providers/RoleProvider'
import { fetchLeads } from '@/lib/queries'

export default async function SalesPipelinePage() {
  const leads = await fetchLeads()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <PageHeader
        title="銷售管線"
        subtitle="潛在客戶追蹤與轉化"
        moduleColor="bg-sky-500"
        action={
          <CanEdit>
            <Link href="/sales/leads/new" className="btn-primary">+ 新增潛在客戶</Link>
          </CanEdit>
        }
      />

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <LeadPipelineBoard initialLeads={leads} />
      </div>
    </div>
  )
}
