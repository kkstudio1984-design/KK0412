export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AddressRiskTable from '@/components/address-risk/AddressRiskTable'
import PageHeader from '@/components/ui/PageHeader'

export default async function AddressRiskPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('space_clients')
    .select(`
      id, service_type, stage, is_high_risk_kyc, blacklist_flag, red_flags,
      organization:organizations(name, tax_id, contact_name),
      kyc_checks(status)
    `)
    .eq('service_type', '借址登記')
    .not('stage', 'in', '("已流失")')
    .order('created_at', { ascending: true })

  type AddressRiskClientRow = {
    id: string
    stage: string
    is_high_risk_kyc: boolean
    blacklist_flag: boolean
    red_flags: string[] | null
    organization?: { name?: string | null; tax_id?: string | null; contact_name?: string | null } | null
    kyc_checks?: { status: string }[] | null
  }
  const allClients = ((clients || []) as unknown as AddressRiskClientRow[]).map((c) => ({
    id: c.id,
    orgName: c.organization?.name || '未知',
    taxId: c.organization?.tax_id || '—',
    contactName: c.organization?.contact_name || '—',
    stage: c.stage,
    isHighRisk: c.is_high_risk_kyc,
    isBlacklist: c.blacklist_flag,
    redFlags: c.red_flags || [],
    kycPassed: (c.kyc_checks || []).filter((k) => k.status === '通過').length,
    kycTotal: (c.kyc_checks || []).length,
  }))

  const highRiskCount = allClients.filter((c) => c.isHighRisk || c.isBlacklist).length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="地址風險總覽"
        subtitle="三院地址所有登記公司一覽"
        moduleColor="bg-amber-500"
        action={
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">共 {allClients.length} 家</span>
            {highRiskCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                {highRiskCount} 高風險
              </span>
            )}
          </div>
        }
      />

      <AddressRiskTable clients={allClients} />
    </div>
  )
}
