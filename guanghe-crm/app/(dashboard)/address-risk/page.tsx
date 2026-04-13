export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AddressRiskTable from '@/components/address-risk/AddressRiskTable'

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

  const allClients = (clients || []).map((c: any) => ({
    id: c.id,
    orgName: c.organization?.name || '未知',
    taxId: c.organization?.tax_id || '—',
    contactName: c.organization?.contact_name || '—',
    stage: c.stage,
    isHighRisk: c.is_high_risk_kyc,
    isBlacklist: c.blacklist_flag,
    redFlags: c.red_flags || [],
    kycPassed: (c.kyc_checks || []).filter((k: any) => k.status === '通過').length,
    kycTotal: (c.kyc_checks || []).length,
  }))

  const highRiskCount = allClients.filter((c: any) => c.isHighRisk || c.isBlacklist).length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">地址風險總覽</h1>
          <p className="text-xs text-gray-400 mt-0.5">三院地址所有登記公司一覽</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">共 {allClients.length} 家</span>
          {highRiskCount > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
              {highRiskCount} 高風險
            </span>
          )}
        </div>
      </div>

      <AddressRiskTable clients={allClients} />
    </div>
  )
}
