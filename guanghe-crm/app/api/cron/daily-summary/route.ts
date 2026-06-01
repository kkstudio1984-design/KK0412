// ── Daily Summary Cron ─────────────────────────────────────────
// 每天 08:00（台北）跑：彙整昨日 24h 關鍵營運指標、寄 HTML email 給光光自己。
// 也可手動觸發 ?force=true&date=YYYY-MM-DD 補寄某天。
//
// 與 monthly-report 區隔：
//   - monthly-report 寄給所有股東 viewer、上月整月 KPI
//   - daily-summary  寄給光光自己（PM_NOTIFY_EMAIL）、昨日 24h KPI
//                    + 7 天內到期合約提醒 + 待處理 KYC
//
// 設計：失敗永遠回 200 + skipped/error JSON、避免 Vercel cron 重試 spam。
//      Resend env 缺時不寄信但仍回統計、可從 cron response body 手動查。

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, subDays, addDays, format } from 'date-fns'
import { sendInlineEmail } from '@/lib/email-transactional'
import { COMPANY_FOOTER_ONE_LINE } from '@/lib/company'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'
    const dateParam = url.searchParams.get('date') // YYYY-MM-DD

    const today = new Date()
    const targetDay = dateParam ? new Date(dateParam) : subDays(today, 1)
    const dayStart = startOfDay(targetDay)
    const dayEnd = endOfDay(targetDay)
    const dayStr = format(targetDay, 'yyyy-MM-dd')
    const dayLabel = format(targetDay, 'yyyy 年 MM 月 dd 日 (E)')

    const startISO = dayStart.toISOString()
    const endISO = dayEnd.toISOString()

    const supabase = await createClient()

    // 7 天內到期合約 window
    const upcomingEnd = addDays(today, 7)
    const upcomingEndISO = format(upcomingEnd, 'yyyy-MM-dd')
    const todayISO = format(today, 'yyyy-MM-dd')

    const [
      paidRes,
      unpaidRes,
      newClientsRes,
      kycPassedRes,
      kycPendingRes,
      emailSentRes,
      emailFailedRes,
      contractsExpiringRes,
    ] = await Promise.all([
      supabase.from('payments')
        .select('amount, status')
        .eq('status', '已收')
        .gte('paid_at', startISO)
        .lte('paid_at', endISO),
      supabase.from('payments')
        .select('amount, status, due_date')
        .neq('status', '已收')
        .gte('due_date', format(dayStart, 'yyyy-MM-dd'))
        .lte('due_date', format(dayEnd, 'yyyy-MM-dd')),
      supabase.from('space_clients')
        .select('id, organization:organizations(name), created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase.from('kyc_checks')
        .select('id, status, checked_at')
        .eq('status', '通過')
        .gte('checked_at', startISO)
        .lte('checked_at', endISO),
      supabase.from('kyc_checks')
        .select('id, status')
        .eq('status', '待處理'),
      supabase.from('email_logs')
        .select('id, status')
        .eq('status', 'sent')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase.from('email_logs')
        .select('id, status, error_message')
        .eq('status', 'failed')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase.from('contracts')
        .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
        .gte('end_date', todayISO)
        .lte('end_date', upcomingEndISO),
    ])

    const sumAmount = (rows: Array<{ amount: number | null }> | null | undefined) =>
      (rows || []).reduce((acc, r) => acc + (r.amount || 0), 0)

    const totalPaid = sumAmount(paidRes.data as Array<{ amount: number | null }>)
    const totalUnpaid = sumAmount(unpaidRes.data as Array<{ amount: number | null }>)
    const newClientsCount = newClientsRes.data?.length || 0
    const kycPassedCount = kycPassedRes.data?.length || 0
    const kycPendingCount = kycPendingRes.data?.length || 0
    const emailSentCount = emailSentRes.data?.length || 0
    const emailFailedCount = emailFailedRes.data?.length || 0
    const contractsExpiring = contractsExpiringRes.data || []

    const formatNTD = (n: number) => `NT$ ${n.toLocaleString()}`
    const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : 'https://guanghe-crm.vercel.app/dashboard'

    const contractRowsHtml = contractsExpiring
      .slice(0, 10)
      .map((c) => {
        const org = (c as { space_client?: { organization?: { name?: string } } | null }).space_client?.organization?.name ?? '未填'
        const type = (c as { contract_type?: string | null }).contract_type ?? '未分類'
        const end = (c as { end_date?: string | null }).end_date ?? '?'
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#1c1917;">${org}</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;color:#57534e;font-size:12px;">${type}</td><td style="padding:6px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-family:monospace;font-size:12px;">${end}</td></tr>`
      })
      .join('')

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${dayLabel} 日報</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif;color:#1c1917;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:inline-flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:bold;">光</div>
        <div>
          <p style="margin:0;color:#78716c;font-size:12px;">光合創學 | Guanghe</p>
          <p style="margin:0;font-weight:600;font-size:14px;">每日營運摘要</p>
        </div>
      </div>
      <h1 style="font-size:22px;margin:16px 0 4px;color:#1c1917;">${dayLabel}</h1>
      <p style="color:#78716c;font-size:13px;margin:0 0 24px;">過去 24 小時 KPI · 7 天內到期合約</p>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">昨日實收</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#15803d;">${formatNTD(totalPaid)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">昨日應收（未收）</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:${totalUnpaid > 0 ? '#b91c1c' : '#1c1917'};">${formatNTD(totalUnpaid)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">昨日新進客戶</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:#1c1917;">${newClientsCount} 家</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">KYC 待處理</p>
          <p style="margin:0;font-size:18px;font-weight:600;color:${kycPendingCount > 0 ? '#d97706' : '#1c1917'};">${kycPendingCount} 件</p>
        </div>
      </div>

      <h2 style="font-size:14px;margin:20px 0 10px;color:#1c1917;">寄信表現（昨日）</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <tbody>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">成功寄出</td><td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:500;color:#15803d;">${emailSentCount} 封</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">寄信失敗</td><td style="padding:8px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:500;color:${emailFailedCount > 0 ? '#b91c1c' : '#1c1917'};">${emailFailedCount} 封</td></tr>
          <tr><td style="padding:8px 0;color:#57534e;">KYC 昨日通過</td><td style="padding:8px 0;text-align:right;font-weight:500;">${kycPassedCount} 件</td></tr>
        </tbody>
      </table>

      ${
        contractsExpiring.length > 0
          ? `<h2 style="font-size:14px;margin:24px 0 10px;color:#1c1917;">⏰ 7 天內到期合約（${contractsExpiring.length} 份、最多顯示 10 份）</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr><th style="text-align:left;padding:6px 0;border-bottom:2px solid #e7e5e4;color:#78716c;font-weight:500;font-size:11px;">客戶</th><th style="text-align:left;padding:6px 0;border-bottom:2px solid #e7e5e4;color:#78716c;font-weight:500;font-size:11px;">類型</th><th style="text-align:right;padding:6px 0;border-bottom:2px solid #e7e5e4;color:#78716c;font-weight:500;font-size:11px;">到期日</th></tr>
        </thead>
        <tbody>${contractRowsHtml}</tbody>
      </table>`
          : ''
      }

      <a href="${dashboardUrl}" style="display:inline-block;margin-top:24px;padding:10px 18px;background:linear-gradient(to right,#f59e0b,#d97706);color:#0a0a0a;font-weight:600;border-radius:8px;text-decoration:none;font-size:13px;">打開儀表板 →</a>
    </div>

    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:24px;">
      ${COMPANY_FOOTER_ONE_LINE} · 此信由系統每日 08:00 自動寄送
    </p>
  </div>
</body>
</html>`

    const subject = `光合創學 ${dayLabel} 日報`
    const recipient = process.env.PM_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL

    let sendStatus: 'sent' | 'failed' | 'skipped' = 'skipped'
    let sendError: string | null = null
    if (recipient) {
      const r = await sendInlineEmail({
        to: recipient,
        toName: '光光',
        subject,
        html,
        related: { table: 'cron', id: `daily-summary-${dayStr}` },
        logKey: `daily_summary_${dayStr}`,
        supabase,
      })
      sendStatus = r.status
      if (r.status === 'failed') sendError = r.error ?? 'unknown'
    }

    return NextResponse.json({
      ok: true,
      date: dayStr,
      label: dayLabel,
      force,
      metrics: {
        paid: totalPaid,
        unpaid: totalUnpaid,
        new_clients: newClientsCount,
        kyc_passed: kycPassedCount,
        kyc_pending_total: kycPendingCount,
        email_sent: emailSentCount,
        email_failed: emailFailedCount,
        contracts_expiring_7d: contractsExpiring.length,
      },
      send: { status: sendStatus, recipient: recipient ?? null, error: sendError },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON daily-summary]', error)
    return NextResponse.json({ error: 'Daily summary failed', details: String(error) }, { status: 200 })
  }
}
