export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import MonthlyReport from '@/components/reports/MonthlyReport'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

export default async function ReportsPage() {
  const supabase = await createClient()
  const now = new Date()

  const months = 6
  const trends: {
    month: string
    revenue: number
    expense: number
    newClients: number
    activeClients: number
  }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i)
    const start = format(startOfMonth(monthDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(monthDate), 'yyyy-MM-dd')
    const label = format(monthDate, 'M月')

    const [revenueRes, expenseRes, newClientsRes, activeClientsRes] = await Promise.all([
      supabase.from('payments').select('amount').eq('status', '已收').gte('paid_at', start).lte('paid_at', end),
      supabase.from('expenses').select('amount').gte('expense_date', start).lte('expense_date', end),
      supabase.from('space_clients').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
      supabase.from('space_clients').select('*', { count: 'exact', head: true }).eq('stage', '服務中').lte('created_at', end),
    ])

    const revenue = (revenueRes.data || []).reduce((s: number, p) => s + (p.amount || 0), 0)
    const expense = (expenseRes.data || []).reduce((s: number, e) => s + (e.amount || 0), 0)

    trends.push({
      month: label,
      revenue,
      expense,
      newClients: newClientsRes.count || 0,
      activeClients: activeClientsRes.count || 0,
    })
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="月報表"
        subtitle="過去 6 個月營運趨勢"
        moduleColor="bg-emerald-500"
        action={<a href="/reports/tax" className="btn-secondary">雙月稅務報表</a>}
      />
      <MonthlyReport trends={trends} />
    </div>
  )
}
