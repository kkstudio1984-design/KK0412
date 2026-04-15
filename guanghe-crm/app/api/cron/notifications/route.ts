import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays, differenceInDays, format } from 'date-fns'

// This endpoint is called by Vercel Cron daily to scan for events and create notifications
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const notifications: Array<{ title: string; message: string; type: string; link?: string }> = []
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const days30Str = format(addDays(new Date(), 30), 'yyyy-MM-dd')
    const days7Str = format(addDays(new Date(), 7), 'yyyy-MM-dd')

    // 1. Contracts expiring within 7 days (urgent)
    const { data: expiringUrgent } = await supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
      .gte('end_date', todayStr)
      .lte('end_date', days7Str)

    for (const c of expiringUrgent || []) {
      const clientName = (c as any).space_client?.organization?.name || '未知'
      const daysLeft = differenceInDays(new Date(c.end_date), new Date())
      notifications.push({
        title: `合約即將到期：${clientName}`,
        message: `${(c as any).contract_type} 合約將於 ${daysLeft} 天後到期（${c.end_date}）`,
        type: 'urgent',
      })
    }

    // 2. Contracts expiring in 8-30 days (warning)
    const { data: expiringWarning } = await supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
      .gt('end_date', days7Str)
      .lte('end_date', days30Str)

    for (const c of expiringWarning || []) {
      const clientName = (c as any).space_client?.organization?.name || '未知'
      const daysLeft = differenceInDays(new Date(c.end_date), new Date())
      notifications.push({
        title: `合約即將到期：${clientName}`,
        message: `${(c as any).contract_type} 合約將於 ${daysLeft} 天後到期`,
        type: 'warning',
      })
    }

    // 3. Overdue payments (auto-escalate and notify)
    const { data: payments } = await supabase
      .from('payments')
      .select('id, due_date, amount, escalation_level, status, space_client:space_clients(organization:organizations(name))')
      .eq('status', '逾期')

    for (const p of payments || []) {
      const clientName = (p as any).space_client?.organization?.name || '未知'
      const daysOverdue = differenceInDays(new Date(), new Date(p.due_date))
      let newLevel = p.escalation_level || '正常'
      if (daysOverdue >= 60) newLevel = '退租啟動'
      else if (daysOverdue >= 30) newLevel = '存證信函'
      else if (daysOverdue >= 14) newLevel = '催告'
      else if (daysOverdue >= 7) newLevel = '提醒'

      // Only update and notify if level changed
      if (newLevel !== p.escalation_level) {
        await supabase.from('payments')
          .update({ escalation_level: newLevel, escalation_updated_at: new Date().toISOString() })
          .eq('id', p.id)

        notifications.push({
          title: `收款升級至「${newLevel}」：${clientName}`,
          message: `逾期 ${daysOverdue} 天，金額 NT$${p.amount.toLocaleString()}`,
          type: newLevel === '退租啟動' ? 'urgent' : 'warning',
        })
      }
    }

    // 4. KYC 審核中 超過 7 天
    const { data: kycStuck } = await supabase
      .from('space_clients')
      .select('id, updated_at, organization:organizations(name)')
      .eq('stage', 'KYC審核中')
      .lt('updated_at', addDays(new Date(), -7).toISOString())

    for (const c of kycStuck || []) {
      const clientName = (c as any).organization?.name || '未知'
      const daysSince = differenceInDays(new Date(), new Date(c.updated_at))
      notifications.push({
        title: `KYC 超時未完成：${clientName}`,
        message: `在 KYC 審核中已 ${daysSince} 天未更新`,
        type: 'warning',
      })
    }

    // 5. Court documents not picked up for 7+ days
    const { data: courtMail } = await supabase
      .from('mail_records')
      .select('id, received_date, space_client:space_clients(organization:organizations(name))')
      .eq('mail_type', '法院文書')
      .eq('pickup_status', '待領取')
      .lt('received_date', format(addDays(new Date(), -7), 'yyyy-MM-dd'))

    for (const m of courtMail || []) {
      const clientName = (m as any).space_client?.organization?.name || '未知'
      const daysSince = differenceInDays(new Date(), new Date(m.received_date))
      notifications.push({
        title: `法院文書未領取：${clientName}`,
        message: `收件日 ${m.received_date}，已 ${daysSince} 天未領取`,
        type: 'urgent',
      })
    }

    // Write all notifications (null user_id = broadcast to all)
    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').insert(
        notifications.map(n => ({
          user_id: null, // broadcast
          title: n.title,
          message: n.message,
          type: n.type,
          link: n.link || null,
        }))
      )
      if (error) throw error
    }

    return NextResponse.json({
      ok: true,
      notifications_created: notifications.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON notifications]', error)
    return NextResponse.json({ error: 'Cron job failed', details: String(error) }, { status: 500 })
  }
}
