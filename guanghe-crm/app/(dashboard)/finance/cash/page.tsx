export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import CashReconciliation from '@/components/finance/CashReconciliation'
import { subDays, format } from 'date-fns'

export default async function CashPage() {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Latest reconciliation (for opening balance)
  const { data: latestRecon } = await supabase
    .from('cash_reconciliations')
    .select('*')
    .order('reconciliation_date', { ascending: false })
    .limit(1)
    .single()

  // Today's transactions
  const { data: todayTx } = await supabase
    .from('cash_transactions')
    .select('*')
    .eq('transaction_date', todayStr)
    .order('created_at', { ascending: false })

  // Last 7 reconciliations
  const { data: recentRecons } = await supabase
    .from('cash_reconciliations')
    .select('*, reconciler:profiles!reconciled_by(name)')
    .order('reconciliation_date', { ascending: false })
    .limit(7)

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="現金盤點"
        subtitle="每日現金收支核對"
        moduleColor="bg-emerald-500"
        breadcrumbs={[{ label: '財務總覽', href: '/finance' }]}
      />
      <CashReconciliation
        todayStr={todayStr}
        latestRecon={latestRecon}
        todayTx={todayTx || []}
        recentRecons={recentRecons || []}
      />
    </div>
  )
}
