import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addDays, differenceInDays, format, startOfDay } from 'date-fns'
import { sendTemplatedEmail } from '@/lib/email-transactional'

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
    let emailsSent = 0
    let emailsFailed = 0
    let emailsSkipped = 0

    const tryEmail = async (templateKey: string, to: string | null | undefined, toName: string | null | undefined, variables: Record<string, string | number | null | undefined>, related: { table: string; id: string }) => {
      if (!to) return
      const r = await sendTemplatedEmail({ templateKey, to, toName: toName || undefined, variables, related, supabase })
      if (r.status === 'sent')    emailsSent++
      if (r.status === 'failed')  emailsFailed++
      if (r.status === 'skipped') emailsSkipped++
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const days7Str  = format(addDays(new Date(), 7),  'yyyy-MM-dd')
    const days30Str = format(addDays(new Date(), 30), 'yyyy-MM-dd')
    const days60Str = format(addDays(new Date(), 60), 'yyyy-MM-dd')
    const todayStart = startOfDay(new Date()).toISOString()

    // ── Dedup: fetch today's notification titles ──────────────────────────
    const { data: todayNotifs } = await supabase
      .from('notifications')
      .select('title')
      .gte('created_at', todayStart)
    const existingTitles = new Set((todayNotifs || []).map((n: { title: string }) => n.title))

    const push = (n: { title: string; message: string; type: string; link?: string }) => {
      if (!existingTitles.has(n.title)) notifications.push(n)
    }

    // ── 1. Contracts expiring 0-7 days (urgent) ──────────────────────────
    const { data: expiringUrgent } = await supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(id, organization:organizations(name, contact_name, contact_email))')
      .gte('end_date', todayStr)
      .lte('end_date', days7Str)

    for (const c of expiringUrgent || []) {
      const org = (c as any).space_client?.organization
      const clientName = org?.name || '未知'
      const clientId   = (c as any).space_client?.id
      const daysLeft = differenceInDays(new Date(c.end_date), new Date())
      push({
        title: `合約即將到期：${clientName}`,
        message: `${(c as any).contract_type} 合約將於 ${daysLeft} 天後到期（${c.end_date}）`,
        type: 'urgent',
        link: clientId ? `/clients/${clientId}` : '/contracts',
      })
      // 7 天前寄一次（最後一次自動提醒，之後由專人聯繫）
      if (daysLeft === 7) {
        await tryEmail('contract_expiring', org?.contact_email, org?.contact_name, {
          client_name: clientName,
          contact_name: org?.contact_name || clientName,
          contract_type: (c as any).contract_type,
          end_date: c.end_date,
          days_left: daysLeft,
        }, { table: 'contracts', id: c.id })
      }
    }

    // ── 2. Contracts expiring 8-30 days (warning) ────────────────────────
    const { data: expiringWarning } = await supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(id, organization:organizations(name, contact_name, contact_email))')
      .gt('end_date', days7Str)
      .lte('end_date', days30Str)

    for (const c of expiringWarning || []) {
      const org = (c as any).space_client?.organization
      const clientName = org?.name || '未知'
      const clientId   = (c as any).space_client?.id
      const daysLeft = differenceInDays(new Date(c.end_date), new Date())
      push({
        title: `合約到期提醒：${clientName}`,
        message: `${(c as any).contract_type} 合約將於 ${daysLeft} 天後到期，請儘早聯繫續約`,
        type: 'warning',
        link: clientId ? `/clients/${clientId}` : '/contracts',
      })
      // 30 天到期那天才寄一次給客戶（避免天天寄信）
      if (daysLeft === 30) {
        await tryEmail('contract_expiring', org?.contact_email, org?.contact_name, {
          client_name: clientName,
          contact_name: org?.contact_name || clientName,
          contract_type: (c as any).contract_type,
          end_date: c.end_date,
          days_left: daysLeft,
        }, { table: 'contracts', id: c.id })
      }
    }

    // ── 3. Contracts expiring 31-60 days (info) ──────────────────────────
    const { data: expiringInfo } = await supabase
      .from('contracts')
      .select('id, end_date, contract_type, space_client:space_clients(id, organization:organizations(name, contact_name, contact_email))')
      .gt('end_date', days30Str)
      .lte('end_date', days60Str)

    for (const c of expiringInfo || []) {
      const org = (c as any).space_client?.organization
      const clientName = org?.name || '未知'
      const clientId   = (c as any).space_client?.id
      const daysLeft = differenceInDays(new Date(c.end_date), new Date())
      push({
        title: `合約 60 天到期預警：${clientName}`,
        message: `${(c as any).contract_type} 合約將於 ${daysLeft} 天後到期，可提前規劃續約`,
        type: 'info',
        link: clientId ? `/clients/${clientId}` : '/contracts',
      })
      // 60 天提前規劃通知，那天才寄
      if (daysLeft === 60) {
        await tryEmail('contract_expiring', org?.contact_email, org?.contact_name, {
          client_name: clientName,
          contact_name: org?.contact_name || clientName,
          contract_type: (c as any).contract_type,
          end_date: c.end_date,
          days_left: daysLeft,
        }, { table: 'contracts', id: c.id })
      }
    }

    // ── 4. Overdue payments (auto-escalate and notify) ────────────────────
    const { data: payments } = await supabase
      .from('payments')
      .select('id, due_date, amount, escalation_level, status, space_client:space_clients(id, organization:organizations(name, contact_name, contact_email))')
      .eq('status', '逾期')

    for (const p of payments || []) {
      const org = (p as any).space_client?.organization
      const clientName = org?.name || '未知'
      const clientId   = (p as any).space_client?.id
      const daysOverdue = differenceInDays(new Date(), new Date(p.due_date))
      let newLevel = p.escalation_level || '正常'
      if (daysOverdue >= 60)      newLevel = '退租啟動'
      else if (daysOverdue >= 30) newLevel = '存證信函'
      else if (daysOverdue >= 14) newLevel = '催告'
      else if (daysOverdue >= 7)  newLevel = '提醒'

      if (newLevel !== p.escalation_level) {
        await supabase.from('payments')
          .update({ escalation_level: newLevel, escalation_updated_at: new Date().toISOString() })
          .eq('id', p.id)

        push({
          title: `收款升級至「${newLevel}」：${clientName}`,
          message: `逾期 ${daysOverdue} 天，金額 NT$${p.amount.toLocaleString()}`,
          type: newLevel === '退租啟動' ? 'urgent' : 'warning',
          link: clientId ? `/clients/${clientId}` : undefined,
        })

        // 升級到「提醒」「催告」「存證信函」時自動寄催繳信給客戶；
        // 「退租啟動」不自動寄（這階段必須由人工親自聯繫）
        if (['提醒', '催告', '存證信函'].includes(newLevel)) {
          await tryEmail('payment_overdue', org?.contact_email, org?.contact_name, {
            client_name: clientName,
            contact_name: org?.contact_name || clientName,
            amount: p.amount.toLocaleString(),
            due_date: p.due_date,
            days_overdue: daysOverdue,
            escalation_level: newLevel,
          }, { table: 'payments', id: p.id })
        }
      }
    }

    // ── 5. KYC 審核中超過 7 天 ───────────────────────────────────────────
    const { data: kycStuck } = await supabase
      .from('space_clients')
      .select('id, updated_at, organization:organizations(name)')
      .eq('stage', 'KYC審核中')
      .lt('updated_at', addDays(new Date(), -7).toISOString())

    for (const c of kycStuck || []) {
      const clientName = (c as any).organization?.name || '未知'
      const daysSince = differenceInDays(new Date(), new Date(c.updated_at))
      push({
        title: `KYC 超時未完成：${clientName}`,
        message: `在 KYC 審核中已 ${daysSince} 天未更新`,
        type: 'warning',
        link: `/clients/${c.id}`,
      })
    }

    // ── 6. 法院文書未領取 7 天以上 ──────────────────────────────────────
    const { data: courtMail } = await supabase
      .from('mail_records')
      .select('id, received_date, space_client:space_clients(id, organization:organizations(name))')
      .eq('mail_type', '法院文書')
      .eq('pickup_status', '待領取')
      .lt('received_date', format(addDays(new Date(), -7), 'yyyy-MM-dd'))

    for (const m of courtMail || []) {
      const clientName = (m as any).space_client?.organization?.name || '未知'
      const clientId   = (m as any).space_client?.id
      const daysSince = differenceInDays(new Date(), new Date(m.received_date))
      push({
        title: `法院文書未領取：${clientName}`,
        message: `收件日 ${m.received_date}，已 ${daysSince} 天未領取`,
        type: 'urgent',
        link: clientId ? `/clients/${clientId}` : undefined,
      })
    }

    // ── Write notifications (broadcast, null user_id) ────────────────────
    if (notifications.length > 0) {
      const { error } = await supabase.from('notifications').insert(
        notifications.map(n => ({
          user_id: null,
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
      skipped_duplicates: (todayNotifs?.length ?? 0),
      emails_sent: emailsSent,
      emails_failed: emailsFailed,
      emails_skipped: emailsSkipped,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON notifications]', error)
    return NextResponse.json({ error: 'Cron job failed', details: String(error) }, { status: 500 })
  }
}
