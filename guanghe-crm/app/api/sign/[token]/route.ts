import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendInlineEmail } from '@/lib/email-transactional'
import { format } from 'date-fns'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      id, signing_status, signing_token_expires_at, signed_at, signer_name,
      contract_type, start_date, end_date, monthly_rent, payment_cycle, deposit_amount,
      space_client:space_clients(
        id,
        organization:organizations(name, contact_name, tax_id)
      )
    `)
    .eq('signing_token', token)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: '連結無效或已過期' }, { status: 404 })
  }

  return NextResponse.json(contract)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { signerName, action, signatureImage, rejectReason } = await req.json()
    // action: 'sign' | 'reject'
    // signatureImage: base64 PNG data URL (only for 'sign')
    // rejectReason: optional free-text reason (only for 'reject')

    // Reject oversized payloads to keep DB lean (PNG from canvas ~20–60KB, cap at 500KB)
    if (signatureImage && typeof signatureImage === 'string' && signatureImage.length > 500_000) {
      return NextResponse.json({ error: '簽名圖片過大' }, { status: 413 })
    }
    // Cap reject_reason length so a malicious client can't bloat the DB
    const trimmedReason = typeof rejectReason === 'string' ? rejectReason.trim().slice(0, 500) : null

    const supabase = await createClient()

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, signing_status, signing_token_expires_at')
      .eq('signing_token', token)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '連結無效' }, { status: 404 })
    }
    if (contract.signing_status !== '待簽署') {
      return NextResponse.json({ error: `合約${contract.signing_status}` }, { status: 409 })
    }
    if (contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()) {
      return NextResponse.json({ error: '簽署連結已過期' }, { status: 410 })
    }

    const signerIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    const newStatus = action === 'reject' ? '已拒絕' : '已簽署'

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        signing_status: newStatus,
        signer_name: signerName || null,
        signer_ip: signerIp,
        signed_at: new Date().toISOString(),
        signature_image_data: action === 'sign' ? (signatureImage || null) : null,
        reject_reason: action === 'reject' ? trimmedReason : null,
      })
      .eq('id', contract.id)

    if (updateError) throw updateError

    // ── 簽署成功時，自動寄一份合約副本給客戶（含手寫簽名圖）──
    // 失敗不影響簽署流程；只記在 console + email_logs。
    if (action === 'sign') {
      try {
        const { data: full } = await supabase
          .from('contracts')
          .select(`
            id, contract_type, start_date, end_date, monthly_rent, payment_cycle,
            deposit_amount, signed_at, signer_name, signature_image_data,
            space_client:space_clients(
              id,
              organization:organizations(name, contact_name, contact_email, tax_id)
            )
          `)
          .eq('id', contract.id)
          .single()

        const org = (full as any)?.space_client?.organization
        if (org?.contact_email) {
          const html = buildContractCopyHtml(full)
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guanghe-crm.vercel.app'
          const printUrl = `${baseUrl}/print/contract/${contract.id}`
          const wrappedHtml = html.replace(
            '<!--PRINT_LINK-->',
            `<a href="${printUrl}" style="color:#d97706;font-size:13px;">在瀏覽器打開可列印副本（建議用 Chrome 開啟，可另存為 PDF）→</a>`
          )
          await sendInlineEmail({
            to: org.contact_email,
            toName: org.contact_name,
            subject: `光合創學 - 您的${(full as any).contract_type}合約副本（GH-${contract.id.slice(0, 8).toUpperCase()}）`,
            html: wrappedHtml,
            related: { table: 'contracts', id: contract.id },
            logKey: 'contract_signed_copy',
            supabase,
          })
        }
      } catch (mailErr) {
        console.error('[sign] failed to send contract copy email:', mailErr)
      }
    }

    // ── 拒簽時，自動通知內部（業務最痛點：客戶丟單你要立刻知道）──
    // 失敗不影響主流程。INTERNAL_NOTIFY_EMAIL 未設時跳過。
    if (action === 'reject') {
      try {
        const internalTo = process.env.INTERNAL_NOTIFY_EMAIL
        if (internalTo) {
          const { data: full } = await supabase
            .from('contracts')
            .select(`
              id, contract_type, start_date, end_date, monthly_rent,
              space_client:space_clients(
                id,
                organization:organizations(name, contact_name, contact_email)
              )
            `)
            .eq('id', contract.id)
            .single()

          const org = (full as any)?.space_client?.organization
          const clientId = (full as any)?.space_client?.id
          const clientName = org?.name || '未知客戶'
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://guanghe-crm.vercel.app'
          const clientUrl = clientId ? `${baseUrl}/clients/${clientId}` : baseUrl
          const contractNo = `GH-${contract.id.slice(0, 8).toUpperCase()}`
          const reasonHtml = trimmedReason
            ? `<div style="background:#fef2f2;border-left:3px solid #f87171;padding:12px 16px;margin:16px 0;color:#991b1b;font-size:14px;line-height:1.6;">${trimmedReason.replace(/\n/g, '<br>')}</div>`
            : `<p style="color:#78716c;font-size:13px;margin:16px 0;">客戶未填寫拒絕原因，建議主動聯繫了解。</p>`

          await sendInlineEmail({
            to: internalTo,
            subject: `🚫 合約被拒簽：${clientName}（${contractNo}）`,
            html: `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,'PingFang TC','Noto Sans TC',sans-serif;color:#1c1917;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px;color:#dc2626;font-size:13px;font-weight:600;">🚫 客戶拒簽合約</p>
    <h1 style="font-size:18px;margin:0 0 16px;">${clientName} · ${contractNo}</h1>
    <table style="width:100%;font-size:13px;color:#44403c;border-collapse:collapse;">
      <tr><td style="padding:4px 0;color:#78716c;width:90px;">合約類型</td><td>${(full as any)?.contract_type || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">簽署人</td><td>${signerName || '—'}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">聯絡人</td><td>${org?.contact_name || '—'}（${org?.contact_email || '—'}）</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">月租金</td><td>NT$ ${Number((full as any)?.monthly_rent || 0).toLocaleString()}</td></tr>
      <tr><td style="padding:4px 0;color:#78716c;">拒簽時間</td><td>${format(new Date(), 'yyyy/MM/dd HH:mm')}</td></tr>
    </table>
    <p style="margin:24px 0 4px;color:#78716c;font-size:12px;">客戶填寫的拒絕原因：</p>
    ${reasonHtml}
    <a href="${clientUrl}" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#1c1917;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;">前往客戶頁面追蹤 →</a>
  </div>
</body></html>`,
            related: { table: 'contracts', id: contract.id },
            logKey: 'contract_rejected_internal',
            supabase,
          })
        }
      } catch (mailErr) {
        console.error('[sign] failed to send reject notification email:', mailErr)
      }
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (error) {
    return NextResponse.json({ error: '簽署失敗', details: String(error) }, { status: 500 })
  }
}

// ── 合約副本 HTML（self-contained，含簽名圖、所有條款）──
function buildContractCopyHtml(c: any): string {
  const org = c?.space_client?.organization || {}
  const fmt = (d: string) => {
    try { return format(new Date(d), 'yyyy 年 MM 月 dd 日') } catch { return d }
  }
  const formatNTD = (n: number) => `NT$ ${n.toLocaleString()}`
  const contractNo = `GH-${String(c.id).slice(0, 8).toUpperCase()}`
  const sigImg = c.signature_image_data
    ? `<img src="${c.signature_image_data}" alt="電子簽名" style="max-height:48px;max-width:200px;object-fit:contain;border-bottom:1px solid #1c1917;padding-bottom:4px;" />`
    : '<div style="border-bottom:1px solid #1c1917;height:32px;"></div>'

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>合約副本 ${contractNo}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'PingFang TC','Noto Sans TC',sans-serif;color:#1c1917;line-height:1.7;">
  <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#f59e0b,#d97706);display:inline-flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:bold;">光</div>
        <div>
          <p style="margin:0;color:#78716c;font-size:12px;">光合創學 | Guanghe</p>
          <p style="margin:0;font-weight:600;font-size:14px;">電子合約副本</p>
        </div>
      </div>

      <h1 style="font-size:22px;margin:24px 0 4px;color:#1c1917;">${c.contract_type}合約書</h1>
      <p style="color:#78716c;font-size:12px;margin:0 0 24px;">合約編號：${contractNo}</p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#15803d;font-size:13px;">
          ✓ 已完成電子簽署（${c.signed_at ? format(new Date(c.signed_at), 'yyyy/MM/dd HH:mm') : ''}） · 簽署人 ${c.signer_name || '—'}
        </p>
      </div>

      <h2 style="font-size:14px;margin:24px 0 12px;color:#1c1917;">立合約書人</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:top;width:50%;padding-right:16px;">
            <p style="margin:0 0 4px;color:#78716c;font-size:11px;">出租方（甲方）</p>
            <p style="margin:0;font-weight:600;">光合創學股份有限公司</p>
            <p style="margin:4px 0 0;color:#57534e;">三院空間</p>
          </td>
          <td style="vertical-align:top;width:50%;">
            <p style="margin:0 0 4px;color:#78716c;font-size:11px;">承租方（乙方）</p>
            <p style="margin:0;font-weight:600;">${org.name || '—'}</p>
            <p style="margin:4px 0 0;color:#57534e;">負責人：${org.contact_name || '—'}</p>
            ${org.tax_id ? `<p style="margin:2px 0 0;color:#57534e;">統一編號：${org.tax_id}</p>` : ''}
          </td>
        </tr>
      </table>

      <h2 style="font-size:14px;margin:24px 0 12px;color:#1c1917;">合約條款</h2>
      <div style="font-size:13px;line-height:1.9;color:#1c1917;">
        <p><strong>第一條（服務內容）</strong></p>
        <p style="padding-left:16px;">甲方提供乙方 <strong>${c.contract_type}</strong> 服務。</p>

        <p><strong>第二條（合約期間）</strong></p>
        <p style="padding-left:16px;">自 <strong>${fmt(c.start_date)}</strong> 起，至 <strong>${fmt(c.end_date)}</strong> 止。</p>

        <p><strong>第三條（費用及繳付方式）</strong></p>
        <p style="padding-left:16px;">月租金：<strong>${formatNTD(c.monthly_rent)}</strong>，繳款週期：<strong>${c.payment_cycle}</strong>。</p>

        <p><strong>第四條（押金）</strong></p>
        <p style="padding-left:16px;">乙方應於簽約時繳納押金 <strong>${formatNTD(c.deposit_amount)}</strong>，於合約終止、結清欠款及恢復場地原狀後無息返還。</p>

        <p><strong>第五條（KYC 與合規義務）</strong></p>
        <p style="padding-left:16px;">乙方同意提供商工登記、司法院裁判書、動產擔保、Google 搜尋、實質受益人審查等 KYC 查核所需資料，並保證所提供資料真實無偽。</p>

        <p><strong>第六條（遷出與違約）</strong></p>
        <p style="padding-left:16px;">合約終止後 30 日內，乙方應完成公司登記地址遷出；逾 30 日未完成者，甲方得扣抵押金 50%；逾 60 日未完成者，甲方得沒收全額押金並單方申請廢止登記。</p>

        <p><strong>第七條（管轄法院）</strong></p>
        <p style="padding-left:16px;">因本合約發生爭議時，雙方合意以臺灣台北地方法院為第一審管轄法院。</p>
      </div>

      <h2 style="font-size:14px;margin:32px 0 12px;color:#1c1917;">簽章</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:bottom;width:50%;padding-right:16px;">
            <p style="margin:0 0 24px;font-weight:600;">甲方：光合創學股份有限公司</p>
            <p style="margin:0 0 4px;color:#78716c;font-size:11px;">負責人簽章：</p>
            <div style="border-bottom:1px solid #1c1917;height:32px;"></div>
          </td>
          <td style="vertical-align:bottom;width:50%;">
            <p style="margin:0 0 24px;font-weight:600;">乙方：${org.name || '—'}</p>
            <p style="margin:0 0 4px;color:#78716c;font-size:11px;">負責人簽章：</p>
            ${sigImg}
          </td>
        </tr>
      </table>

      <div style="margin:32px 0 16px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
        <p style="margin:0 0 6px;color:#92400e;font-size:13px;">這是一份自動產生的合約副本。如需可列印的版本：</p>
        <p style="margin:0;"><!--PRINT_LINK--></p>
      </div>

      <p style="text-align:center;color:#a8a29e;font-size:11px;margin:24px 0 0;">
        中華民國 ${new Date().getFullYear() - 1911} 年 ${new Date().getMonth() + 1} 月 ${new Date().getDate()} 日
      </p>
    </div>

    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:16px;">
      光合創學股份有限公司 · 此信由系統自動寄送
    </p>
  </div>
</body>
</html>`
}
