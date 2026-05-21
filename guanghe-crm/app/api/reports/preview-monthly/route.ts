// ── Monthly Report Preview ─────────────────────────────────
// 直接在瀏覽器打開就看得到當月（或指定月份）月報的 HTML 預覽，
// 不會寄信。受 middleware 保護（必須登入後台）。
//
// 用法：
//   /api/reports/preview-monthly                  → 預設上個月
//   /api/reports/preview-monthly?month=2026-04    → 指定 2026-04

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { fetchClientsHealthSnapshot } from '@/lib/queries'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const monthParam = url.searchParams.get('month') // YYYY-MM

    const today = new Date()
    const targetMonth = monthParam ? new Date(`${monthParam}-15`) : subMonths(today, 1)
    const monthStart = startOfMonth(targetMonth)
    const monthEnd = endOfMonth(targetMonth)
    const monthStr = format(targetMonth, 'yyyy-MM')
    const monthLabel = format(targetMonth, 'yyyy 年 MM 月')

    const supabase = await createClient()

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
      contractsRejectedRes,
    ] = await Promise.all([
      supabase.from('payments')
        .select('amount, paid_at, status')
        .eq('status', '已收')
        .gte('paid_at', startISO)
        .lte('paid_at', endISO),
      supabase.from('payments')
        .select('amount, due_date, status')
        .gte('due_date', startDate)
        .lte('due_date', endDate),
      supabase.from('space_clients')
        .select('id, organization:organizations(name), service_type, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase.from('space_clients')
        .select('id, organization:organizations(name), updated_at, lost_at')
        .or(`and(stage.eq.已結案,updated_at.gte.${startISO},updated_at.lte.${endISO}),and(lost_at.gte.${startISO},lost_at.lte.${endISO})`),
      supabase.from('kyc_checks')
        .select('id, status, checked_at')
        .eq('status', '通過')
        .gte('checked_at', startISO)
        .lte('checked_at', endISO),
      supabase.from('contracts')
        .select('id, end_date, contract_type, space_client:space_clients(organization:organizations(name))')
        .gte('end_date', startDate)
        .lte('end_date', endDate),
      supabase.from('contracts')
        .select('id, signed_at, signing_status, space_client:space_clients(organization:organizations(name))')
        .eq('signing_status', '已拒絕')
        .gte('signed_at', startISO)
        .lte('signed_at', endISO),
    ])

    // 即時健康度快照（不限月份，是「現在」這個時點的狀態）
    const healthSnapshot = await fetchClientsHealthSnapshot()

    const sumAmount = (rows: Array<{ amount: number }> | null | undefined) =>
      (rows || []).reduce((acc, r) => acc + (r.amount || 0), 0)

    const totalReceivable = sumAmount(unpaidRes.data as any)
    const totalReceived = sumAmount(paidRes.data as any)
    const gap = totalReceivable - totalReceived
    const collectionRate = totalReceivable > 0
      ? Math.round((totalReceived / totalReceivable) * 100)
      : 0
    const newClientsCount = newClientsRes.data?.length || 0
    const offboardedCount = offboardedRes.data?.length || 0
    const kycPassedCount = kycPassedRes.data?.length || 0
    const contractsExpiredCount = contractsExpiredRes.data?.length || 0
    const contractsRejectedCount = contractsRejectedRes.data?.length || 0
    const newClientNames = (newClientsRes.data || [])
      .map((c: any) => c?.organization?.name)
      .filter(Boolean)
      .slice(0, 10)
    const expiredContractNames = (contractsExpiredRes.data || [])
      .map((c: any) => c?.space_client?.organization?.name)
      .filter(Boolean)
      .slice(0, 10)

    const formatNTD = (n: number) => `NT$ ${n.toLocaleString()}`
    const dashboardUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`
      : 'https://guanghe-crm.vercel.app/dashboard'

    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>${monthLabel} 月報</title>
<style>
  @media print {
    body { background: #fff !important; }
    .no-print { display: none !important; }
    .card { box-shadow: none !important; border: 1px solid #d6d3d1; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif;color:#1c1917;">
  <div style="max-width:720px;margin:0 auto;padding:32px 20px;">
    <div class="no-print" style="margin-bottom:16px;display:flex;gap:8px;align-items:center;font-size:13px;color:#78716c;">
      <span style="display:inline-block;padding:4px 10px;background:#fef3c7;color:#92400e;border-radius:6px;font-weight:600;">預覽模式</span>
      <span>本頁可直接 ⌘P 列印或匯出 PDF · 切換月份請改 URL：?month=YYYY-MM</span>
    </div>

    <div class="card" style="background:#ffffff;border-radius:16px;padding:36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:inline-flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:bold;font-size:18px;">光</div>
        <div>
          <p style="margin:0;color:#78716c;font-size:12px;">光合創學 | Guanghe</p>
          <p style="margin:0;font-weight:600;font-size:14px;">股東月報</p>
        </div>
      </div>
      <h1 style="font-size:26px;margin:16px 0 4px;color:#1c1917;">${monthLabel}</h1>
      <p style="color:#78716c;font-size:13px;margin:0 0 28px;">${startDate} – ${endDate}</p>

      <h2 style="font-size:14px;margin:20px 0 12px;color:#78716c;font-weight:600;letter-spacing:0.5px;">財務</h2>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px;">
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:18px;">
          <p style="margin:0 0 6px;color:#78716c;font-size:12px;">本月應收</p>
          <p style="margin:0;font-size:22px;font-weight:600;color:#1c1917;">${formatNTD(totalReceivable)}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:18px;">
          <p style="margin:0 0 6px;color:#78716c;font-size:12px;">本月實收</p>
          <p style="margin:0;font-size:22px;font-weight:600;color:#15803d;">${formatNTD(totalReceived)}</p>
        </div>
        <div style="background:${gap > 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${gap > 0 ? '#fecaca' : '#bbf7d0'};border-radius:12px;padding:18px;">
          <p style="margin:0 0 6px;color:#78716c;font-size:12px;">缺口</p>
          <p style="margin:0;font-size:22px;font-weight:600;color:${gap > 0 ? '#b91c1c' : '#15803d'};">${formatNTD(Math.abs(gap))}${gap > 0 ? '' : '（已收齊）'}</p>
        </div>
        <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:18px;">
          <p style="margin:0 0 6px;color:#78716c;font-size:12px;">收款率</p>
          <p style="margin:0;font-size:22px;font-weight:600;color:#1c1917;">${collectionRate}%</p>
        </div>
      </div>

      <h2 style="font-size:14px;margin:32px 0 12px;color:#78716c;font-weight:600;letter-spacing:0.5px;">客戶動態</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">本月新增客戶</td><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600;">${newClientsCount} 家</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">本月退場 / 結案</td><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600;">${offboardedCount} 家</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">KYC 查核通過</td><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600;">${kycPassedCount} 項</td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;color:#57534e;">本月合約到期</td><td style="padding:12px 0;border-bottom:1px solid #e7e5e4;text-align:right;font-weight:600;">${contractsExpiredCount} 份</td></tr>
          <tr><td style="padding:12px 0;color:#57534e;">本月合約被拒簽</td><td style="padding:12px 0;text-align:right;font-weight:600;color:${contractsRejectedCount > 0 ? '#b91c1c' : '#1c1917'};">${contractsRejectedCount} 份</td></tr>
        </tbody>
      </table>

      ${newClientNames.length > 0 ? `
      <h2 style="font-size:14px;margin:32px 0 12px;color:#78716c;font-weight:600;letter-spacing:0.5px;">本月新增客戶名單</h2>
      <p style="margin:0;font-size:14px;line-height:1.9;color:#1c1917;">${newClientNames.join('、')}${newClientsCount > 10 ? `⋯⋯ 等 ${newClientsCount} 家` : ''}</p>
      ` : ''}

      ${expiredContractNames.length > 0 ? `
      <h2 style="font-size:14px;margin:28px 0 12px;color:#78716c;font-weight:600;letter-spacing:0.5px;">本月到期合約</h2>
      <p style="margin:0;font-size:14px;line-height:1.9;color:#1c1917;">${expiredContractNames.join('、')}${contractsExpiredCount > 10 ? `⋯⋯ 等 ${contractsExpiredCount} 份` : ''}</p>
      ` : ''}

      <h2 style="font-size:14px;margin:32px 0 12px;color:#78716c;font-weight:600;letter-spacing:0.5px;">客戶健康度（即時快照）</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 12px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#166534;font-size:11px;font-weight:600;letter-spacing:0.5px;">健康</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#15803d;">${healthSnapshot.totals.healthy}<span style="font-size:13px;font-weight:400;color:#78716c;"> 家</span></p>
        </div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#92400e;font-size:11px;font-weight:600;letter-spacing:0.5px;">注意</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#b45309;">${healthSnapshot.totals.attention}<span style="font-size:13px;font-weight:400;color:#78716c;"> 家</span></p>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:14px;">
          <p style="margin:0 0 4px;color:#991b1b;font-size:11px;font-weight:600;letter-spacing:0.5px;">危險</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#b91c1c;">${healthSnapshot.totals.risk}<span style="font-size:13px;font-weight:400;color:#78716c;"> 家</span></p>
        </div>
      </div>
      ${healthSnapshot.risk.length > 0 ? `
      <p style="margin:0 0 6px;color:#78716c;font-size:13px;font-weight:600;">需立刻聯繫的危險客戶（${healthSnapshot.risk.length} 家）：</p>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.9;color:#991b1b;">${healthSnapshot.risk.slice(0, 12).map(r => r.clientName).join('、')}${healthSnapshot.risk.length > 12 ? `⋯⋯ 等 ${healthSnapshot.risk.length} 家` : ''}</p>
      ` : ''}
      <p style="margin:0 0 24px;font-size:12px;color:#a8a29e;font-style:italic;">健康度依逾期、升級層級、KYC 卡關、合約到期、拒簽紀錄即時計算，反映本月最後一天的客戶池狀態。</p>

      <div style="margin:36px 0 16px;padding:18px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.7;">
          完整數據與細部明細請進系統儀表板查看。如有任何疑問，直接 Email 光光（kkstudio1984@gmail.com）即可。
        </p>
      </div>

      <a href="${dashboardUrl}" class="no-print" style="display:inline-block;padding:12px 22px;background:linear-gradient(to right,#f59e0b,#d97706);color:#0a0a0a;font-weight:600;border-radius:10px;text-decoration:none;font-size:14px;">打開儀表板 →</a>
    </div>

    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:24px;">
      光合創學股份有限公司 · 統編 60350883 · 臺北市大安區和平東路三段 280 號 2 樓之一 · 此頁由系統即時產生（${format(today, 'yyyy/MM/dd HH:mm')}）
    </p>
  </div>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[reports/preview-monthly]', error)
    return new Response(
      `<html><body style="font-family:sans-serif;padding:40px;"><h1>月報預覽失敗</h1><pre>${String(error)}</pre></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
