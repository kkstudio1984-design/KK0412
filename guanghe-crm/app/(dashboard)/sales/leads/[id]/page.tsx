export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import LeadInfo from '@/components/leads/LeadInfo'
import LeadConvertButton from '@/components/leads/LeadConvertButton'
import { fetchLead } from '@/lib/queries'

const STAGE_BADGE: Record<string, string> = {
  '初步接觸': 'bg-stone-50 text-stone-600 border-stone-200',
  '需求確認': 'bg-amber-50 text-amber-700 border-amber-200',
  '報價中':   'bg-sky-50 text-sky-700 border-sky-200',
  '成交':     'bg-emerald-50 text-emerald-700 border-emerald-200',
  '流失':     'bg-rose-50 text-rose-600 border-rose-200',
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const lead = await fetchLead(id)
  if (!lead) notFound()

  const badgeCls = STAGE_BADGE[lead.stage] ?? 'bg-stone-50 text-stone-600 border-stone-200'

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Breadcrumb + header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/sales"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 銷售管線
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900 truncate">
          {lead.contactName}
        </h1>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeCls}`}>
          {lead.stage}
        </span>
      </div>

      <div className="space-y-4">
        {/* Basic info */}
        <LeadInfo lead={lead} />

        {/* Organization info */}
        {lead.organization && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-3">關聯組織</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">組織名稱</p>
                <p className="text-sm text-gray-900 font-medium">{lead.organization.name}</p>
              </div>
              {lead.organization.taxId && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">統一編號</p>
                  <p className="text-sm text-gray-700">{lead.organization.taxId}</p>
                </div>
              )}
              {lead.organization.contactPhone && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">聯絡電話</p>
                  <p className="text-sm text-gray-700">{lead.organization.contactPhone}</p>
                </div>
              )}
              {lead.organization.contactEmail && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm text-gray-700">{lead.organization.contactEmail}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Convert button */}
        <LeadConvertButton lead={lead} />
      </div>
    </div>
  )
}
