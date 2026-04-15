import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

// GET /api/reports/monthly?months=6
// Returns monthly trend data for the last N months
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const months = parseInt(searchParams.get('months') || '6')

    const supabase = await createClient()
    const now = new Date()

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

      // Revenue this month (status = 已收)
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', '已收')
        .gte('paid_at', start)
        .lte('paid_at', end)

      const revenue = (revenueData || []).reduce((s: number, p) => s + (p.amount || 0), 0)

      // Expenses this month
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', start)
        .lte('expense_date', end)

      const expense = (expenseData || []).reduce((s: number, e) => s + (e.amount || 0), 0)

      // New clients this month
      const { count: newClients } = await supabase
        .from('space_clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start)
        .lte('created_at', end)

      // Active clients (服務中 as of end of month)
      const { count: activeClients } = await supabase
        .from('space_clients')
        .select('*', { count: 'exact', head: true })
        .eq('stage', '服務中')
        .lte('created_at', end)

      trends.push({
        month: label,
        revenue,
        expense,
        newClients: newClients || 0,
        activeClients: activeClients || 0,
      })
    }

    return NextResponse.json(trends)
  } catch (error) {
    console.error('[GET /api/reports/monthly]', error)
    return NextResponse.json({ error: '載入月報表失敗' }, { status: 500 })
  }
}
