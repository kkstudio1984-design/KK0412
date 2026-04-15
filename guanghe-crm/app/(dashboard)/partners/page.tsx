export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import PartnerList from '@/components/partners/PartnerList'

export default async function PartnersPage() {
  const supabase = await createClient()

  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .order('onboarded_at', { ascending: false })

  const { data: earnings } = await supabase
    .from('partner_earnings')
    .select('partner_id, amount, status')

  const earningsByPartner: Record<string, { pending: number; accrued: number; paid: number }> = {}
  for (const e of earnings || []) {
    const pid = (e as { partner_id: string }).partner_id
    if (!earningsByPartner[pid]) earningsByPartner[pid] = { pending: 0, accrued: 0, paid: 0 }
    const amt = (e as { amount: number }).amount
    const st = (e as { status: string }).status
    if (st === '待結算') earningsByPartner[pid].pending += amt
    else if (st === '已累積') earningsByPartner[pid].accrued += amt
    else if (st === '已支付') earningsByPartner[pid].paid += amt
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="夥伴管理"
        subtitle="身障夥伴資料、出勤與薪資"
        moduleColor="bg-pink-500"
      />
      <PartnerList initialPartners={partners || []} earningsByPartner={earningsByPartner} />
    </div>
  )
}
