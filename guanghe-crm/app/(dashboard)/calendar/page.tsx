export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import CalendarView from '@/components/calendar/CalendarView'
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams
  const targetDate = params.month ? new Date(params.month + '-01') : new Date()

  const supabase = await createClient()
  const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd')

  // Fetch all events happening this month
  const [paymentsRes, followUpsRes, sessionsRes, contractsRes, mailRes] = await Promise.all([
    supabase
      .from('payments')
      .select('id, due_date, amount, status, space_client:space_clients(organization:organizations(name))')
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd),
    supabase
      .from('space_clients')
      .select('id, follow_up_date, next_action, organization:organizations(name)')
      .gte('follow_up_date', monthStart)
      .lte('follow_up_date', monthEnd)
      .not('follow_up_date', 'is', null),
    supabase
      .from('course_sessions')
      .select('id, session_date, start_time, location, course:courses(name)')
      .gte('session_date', monthStart)
      .lte('session_date', monthEnd),
    supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
      .gte('end_date', monthStart)
      .lte('end_date', monthEnd),
    supabase
      .from('mail_records')
      .select('id, received_date, mail_type, sender, pickup_status, space_client:space_clients(organization:organizations(name))')
      .gte('received_date', monthStart)
      .lte('received_date', monthEnd),
  ])

  const events = [
    ...(paymentsRes.data || []).map((p) => {
      const client = (p as any).space_client?.organization?.name || '—'
      return {
        id: `payment-${p.id}`,
        date: p.due_date,
        type: 'payment' as const,
        color: p.status === '已收' ? '#34d399' : p.status === '逾期' ? '#f87171' : '#fbbf24',
        label: `💰 ${client}`,
        detail: `NT$${p.amount.toLocaleString()} · ${p.status}`,
      }
    }),
    ...(followUpsRes.data || []).map((c) => ({
      id: `followup-${c.id}`,
      date: c.follow_up_date as string,
      type: 'followup' as const,
      color: '#0ea5e9',
      label: `📞 ${(c as any).organization?.name || '—'}`,
      detail: c.next_action || '跟進',
    })),
    ...(sessionsRes.data || []).map((s) => ({
      id: `session-${s.id}`,
      date: s.session_date,
      type: 'session' as const,
      color: '#ec4899',
      label: `🎓 ${(s as any).course?.name || '課程'}`,
      detail: s.start_time ? `${s.start_time.slice(0, 5)} · ${s.location || ''}` : s.location || '',
    })),
    ...(contractsRes.data || []).map((ct) => ({
      id: `contract-${ct.id}`,
      date: ct.end_date,
      type: 'contract' as const,
      color: '#8b5cf6',
      label: `📜 ${(ct as any).space_client?.organization?.name || '—'}`,
      detail: `${ct.contract_type} 到期`,
    })),
    ...(mailRes.data || []).map((m) => ({
      id: `mail-${m.id}`,
      date: m.received_date,
      type: 'mail' as const,
      color: m.mail_type === '法院文書' ? '#ef4444' : '#a8a29e',
      label: `✉ ${m.mail_type}`,
      detail: `${(m as any).space_client?.organization?.name || ''} · ${m.sender}`,
    })),
  ]

  const monthStr = format(targetDate, 'yyyy-MM')
  const prevMonth = format(addMonths(targetDate, -1), 'yyyy-MM')
  const nextMonth = format(addMonths(targetDate, 1), 'yyyy-MM')
  const currentMonthLabel = format(targetDate, 'yyyy 年 M 月')

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="日曆"
        subtitle="收款、跟進、課程、合約、信件一覽"
        moduleColor="bg-amber-500"
        action={
          <div className="flex items-center gap-2">
            <a href={`/calendar?month=${prevMonth}`} className="btn-secondary text-xs px-3 py-1.5">‹</a>
            <span className="text-sm font-semibold text-white px-3">{currentMonthLabel}</span>
            <a href={`/calendar?month=${nextMonth}`} className="btn-secondary text-xs px-3 py-1.5">›</a>
            <a href="/calendar" className="btn-secondary text-xs px-3 py-1.5">今天</a>
          </div>
        }
      />
      <CalendarView events={events} month={monthStr} />
    </div>
  )
}
