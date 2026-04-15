export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import TaxReport from '@/components/reports/TaxReport'
import { format } from 'date-fns'

function getBimonthlyPeriod(period: string) {
  const match = period.match(/^(\d{4})-(\d)$/)
  if (!match) return null
  const year = parseInt(match[1])
  const periodNum = parseInt(match[2])
  if (periodNum < 1 || periodNum > 6) return null
  const startMonth = (periodNum - 1) * 2 + 1
  const endMonth = startMonth + 1
  const startDate = new Date(year, startMonth - 1, 1)
  const endDate = new Date(year, endMonth, 0)
  return { startDate, endDate, label: `${year} 年 ${startMonth}-${endMonth} 月` }
}

export default async function TaxReportPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams
  const now = new Date()
  const currentPeriod = Math.ceil((now.getMonth() + 1) / 2)
  const defaultPeriod = `${now.getFullYear()}-${currentPeriod}`
  const period = sp.period || defaultPeriod

  const parsed = getBimonthlyPeriod(period)
  if (!parsed) return <div className="p-8 text-red-500">無效期間</div>

  const { startDate, endDate, label } = parsed
  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr = format(endDate, 'yyyy-MM-dd')

  const supabase = await createClient()
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      id, due_date, amount, status, paid_at,
      space_client:space_clients(
        service_type,
        organization:organizations(name, tax_id)
      )
    `)
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)
    .order('paid_at', { ascending: true })

  const rows = (payments || []).map((p: any) => ({
    id: p.id,
    date: p.paid_at,
    orgName: p.space_client?.organization?.name || '—',
    taxId: p.space_client?.organization?.tax_id || '—',
    serviceType: p.space_client?.service_type || '—',
    amount: p.amount,
  }))

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="雙月稅務報表"
        subtitle={label}
        moduleColor="bg-emerald-500"
        breadcrumbs={[{ label: '月報表', href: '/reports' }, { label: '雙月稅務' }]}
      />
      <TaxReport rows={rows} period={period} periodLabel={label} />
    </div>
  )
}
