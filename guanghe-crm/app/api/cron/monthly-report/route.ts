// ── Monthly Report Cron ────────────────────────────────────────
// 每月 1 號 09:00 自動跑：彙整上個月關鍵營運指標，寄 HTML email 給所有股東（viewer）。
// 也可以手動觸發 ?force=true&month=YYYY-MM 補寄某個月。

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { sendInlineEmail } from '@/lib/email-transactional'
import { COMPANY_FOOTER_ONE_LINE } from '@/lib/company'

export async function GET(req: NextRequest) {
  // Cron 鑑權（如有設定）
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'
    const monthParam = url.searchParams.get('month') // YYYY-MM

    const today = new Date()
    // 預設只在「每月 1 號」執行；其他日子若沒帶 ?force=true 就跳過
    if (today.getDate() !== 1 && !force) {
      return NextResponse.json({ skipped: true, reason: 'not first day of month, use ?force=true to override' })
    }

    // 鎖定要產的月份
    const targetMonth = monthParam ? new Date(`${monthParam}-15`) : subMonths(today, 1)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)
    const monthStr = format(targetMonth, 'yyyy-MM')
    const monthLabel = format(targetMonth, 'yyyy 年 MM 月')

    const supabase = await createClient()

    // ── 抓上月關鍵指標 ────────────────────────────────────────
    const startISO = monthStart.toISOString()
    const endISO = monthEnd.toISOString()
    const startDate = format(monthStart, 'yyyy-MM-dd')
    const endDate = format(monthEnd, 'yyyy-MM-dd')

    const [
      paidRes,
      unpaidRes,
      newClientsRes,
      offboardedRes,
      kycPassedRes,
      contractsExpiredRes,
      viewersRes,
    ] = await Promise.all([
      // 上月實收
      supabase.from('payments')
        .select('amount, paid_at, status')
        .eq('status', '已收')
        .gte('paid_at', startISO)
        .lte('paid_at', endISO),
      // 上月應收（不論收沒收，按 due_date 落在月內）
      supabase.from('payments')
        .select('amount, due_date, status')
        .gte('due_date', startDate)
        .lte('due_date', endDate),
      // 上月新增 SpaceClient
      supabase.from('space_clients')
        .select('id, organization:organizations(name), service_type, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      // 上月退場（stage 為已結案，且 updated_at 在月內）
      supabase.from('space_clients')
        .select('id, organization:organizations(name), updated_at, lost_at')
        .or(`and(stage.eq.已結案,updated_at.gte.${startISO},updated_at.lte.${endISO}),and(lost_at.gte.${startISO},lost_at.lte.${endISO})`),
      // 上月 KYC 通過
      supabase.from('kyc_checks')
        .select('id, status, checked_at')
        .eq('status', '通過')
        .gte('checked_at', startISO)
        .lte('checked_at', endISO),
      // 上月到期合約
      supabase.from('contracts')
        .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
        .gte('end_date', startDate)
        .lte('end_date', endDate),
      // 所有股東 viewer
      supabase.from('profiles')
        .select('id, name, email, role')
        .eq('role', 'viewer'),
    ])

    const sumAmount = (rows: Array<{ amount: number }> | null | undefined) =>
      (rows || []).reduce((acc, r) => acc + (r.amount || 0), 0)

    const totalReceivable = sumAmount(unpaidRes.data as any)
    const totalReceived = sumAmount(paidRes.data as any)
    const gap = totalReceivable - totalReceived
    const newClientsCount = newClientsRes.data?.length || 0
    const offboardedCount = offboardedRes.data?.length || 0
    const kycPassedCount = kycPassedRes.data?.length || 0
    const contractsExpiredCount = contractsExpiredRes.data?.length || 0
    const viewers = viewersRes.data || []

    // ── 組 HTML ───────────────────────────────────────────────
    const formatNTD = (n: number) => `NT$ ${n.toLocaleString()}`
    const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : 'https://guanghe-crm.vercel.app/dashboard'

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${monthLabel} 月報</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif;color:#1c1917;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:inline-flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:bold;">光</div>
        <div>
          <p style="margin:0;color:#78716c;font-size:12px;">光合創學 | Guanghe</p>
          <p style="margin:0;font-weight:600;font-size:14px;">股東月報</p>
        </div>
      </div>
      <h1 style="font-size:24px;margin:16px 0 4px;color:#1c1917;">${monthLabel}</h1>
      <p style="color:#78716c;font-size:13px;margin:0 0 24px;">${startDate} – ${endDate}</p>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:24px;">
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">本月應收</p>
          <p style="margin:0;font-size:20px;font-weight:600;color:#1c1917;">${formatNTD(totalReceivable)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">本月實收</p>
          <p style="margin:0;font-size:20px;font-weight:600;color:#15803d;">${formatNTD(totalReceived)}</p>
        </div>
        <div style="background:${gap > 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${gap > 0 ? '#fecaca' : '#bbf7d0'};border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">缺口</p>
          <p style="margin:0;font-size:20px;font-weight:600;color:${gap > 0 ? '#b91c1c' : '#15803d'};">${formatNTD(Math.abs(gap))}${gap > 0 ? '' : '（已收齊）'}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:16px;">
          <p style="margin:0 0 4px;color:#78716c;font-size:12px;">本月新增客戶</p>
          <p style="margin:0;font-size:20px;font-weight:600;color:#1c1917;">${newClientsCount} 家</p>
        </div>
      </div>

      <h2 style="font-size:16px;margin:24px 0 12px;color:#1c1917;">營運摘要</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">本月退場 / 結案</td><td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:500;">${offboardedCount} 家</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">KYC 查核通過</td><td style="padding:10px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:500;">${kycPassedCount} 項</td></tr>
          <tr><td style="padding:10px 0;color:#57534e;">本月合約到期</td><td style="padding:10px 0;text-align:right;font-weight:500;">${contractsExpiredCount} 份</td></tr>
        </tbody>
      </table>

      <div style="margin:32px 0 16px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.7;">
          完整數據與細部明細請進系統儀表板查看。如有任何疑問，直接 Email 光光（kkstudio1984@gmail.com）即可。
        </p>
      </div>

      <a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:linear-gradient(to right,#f59e0b,#d97706);color:#0a0a0a;font-weight:600;border-radius:8px;text-decoration:none;font-size:14px;">打開儀表板 →</a>
    </div>

    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:24px;">
      ${COMPANY_FOOTER_ONE_LINE} · 此信由系統自動寄送
    </p>
  </div>
</body>
</html>`

    const subject = `光合創學 ${monthLabel} 月報`

    // ── 寄給每位 viewer ────────────────────────────────────────
    let sentCount = 0
    let failedCount = 0
    let skippedCount = 0

    for (const v of viewers) {
      if (!v.email) { skippedCount++; continue }
      const r = await sendInlineEmail({
        to: v.email,
        toName: v.name,
        subject,
        html,
        related: { table: 'profiles', id: v.id },
        logKey: `monthly_report_${monthStr}`,
        supabase,
      })
      if (r.status === 'sent') sentCount++
      else if (r.status === 'failed') failedCount++
      else skippedCount++
    }

    return NextResponse.json({
      ok: true,
      month: monthStr,
      label: monthLabel,
      metrics: {
        receivable: totalReceivable,
        received: totalReceived,
        gap,
        new_clients: newClientsCount,
        offboarded: offboardedCount,
        kyc_passed: kycPassedCount,
        contracts_expired: contractsExpiredCount,
      },
      viewers_total: viewers.length,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON monthly-report]', error)
    return NextResponse.json({ error: 'Monthly report failed', details: String(error) }, { status: 500 })
  }
}
