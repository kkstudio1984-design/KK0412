export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">公司名稱</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">統一編號</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">負責人</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">狀態</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">KYC</th>
              <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3 tracking-wide">風險</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allClients.map((c: any) => (
              <tr key={c.id} className={`hover:bg-stone-50 transition-colors ${c.isHighRisk || c.isBlacklist ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="font-medium text-gray-800 hover:text-amber-600">{c.orgName}</Link>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.taxId}</td>
                <td className="px-4 py-3 text-gray-600">{c.contactName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{c.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${c.kycPassed === c.kycTotal && c.kycTotal > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {c.kycPassed}/{c.kycTotal}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {c.isHighRisk && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">高風險</span>}
                    {c.isBlacklist && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">黑名單</span>}
                    {c.redFlags.length > 0 && <span className="text-xs text-red-500">紅旗{c.redFlags.length}</span>}
                    {!c.isHighRisk && !c.isBlacklist && c.redFlags.length === 0 && <span className="text-xs text-gray-300">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
