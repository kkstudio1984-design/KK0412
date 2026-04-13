export const dynamic = 'force-dynamic'

import Link from 'next/link'
import LeadPipelineBoard from '@/components/leads/LeadPipelineBoard'
import { fetchLeads } from '@/lib/queries'

export default async function SalesPipelinePage() {
  const leads = await fetchLeads()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">銷售管線</h1>
          <p className="text-xs text-gray-400 mt-0.5">共 {leads.length} 筆潛在客戶</p>
        </div>
        <Link
          href="/sales/leads/new"
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <span className="text-base leading-none">+</span>
          新增潛在客戶
        </Link>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <LeadPipelineBoard initialLeads={leads} />
      </div>
    </div>
  )
}
