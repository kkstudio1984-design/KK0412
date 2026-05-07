import { Resend } from 'resend'

type NotificationItem = {
  title: string
  message: string
  type: string
  link?: string
}

const PRODUCTION_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://guanghe-crm.vercel.app'
const FROM_ADDRESS = process.env.EMAIL_FROM || '光合創學 CRM <onboarding@resend.dev>'

export async function sendDailyDigest(items: NotificationItem[]) {
  const apiKey = process.env.RESEND_API_KEY
  const recipients = (process.env.NOTIFICATION_RECIPIENTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!apiKey || recipients.length === 0 || items.length === 0) {
    return { skipped: true, reason: !apiKey ? 'no_api_key' : recipients.length === 0 ? 'no_recipients' : 'no_items' }
  }

  const grouped = items.reduce<Record<string, NotificationItem[]>>((acc, n) => {
    (acc[n.type] ||= []).push(n)
    return acc
  }, {})

  const sections = Object.entries(grouped)
    .map(([type, list]) => {
      const rows = list
        .map((n) => {
          const link = n.link ? `${PRODUCTION_URL}${n.link}` : null
          const titleHtml = link
            ? `<a href="${link}" style="color:#d97706;text-decoration:none;font-weight:600;">${escapeHtml(n.title)}</a>`
            : `<strong>${escapeHtml(n.title)}</strong>`
          return `<li style="margin-bottom:8px;">${titleHtml}<br><span style="color:#555;font-size:13px;">${escapeHtml(n.message)}</span></li>`
        })
        .join('')
      return `<h3 style="color:#0a0a0a;margin:20px 0 8px;font-size:15px;">${typeLabel(type)}（${list.length}）</h3><ul style="padding-left:18px;margin:0;">${rows}</ul>`
    })
    .join('')

  const html = `<div style="font-family:-apple-system,'PingFang TC','Microsoft JhengHei',sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#0a0a0a;">
    <div style="border-bottom:2px solid #d97706;padding-bottom:12px;margin-bottom:20px;">
      <h2 style="margin:0;font-size:18px;">光合創學 CRM 每日提醒</h2>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">${new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Taipei' })} · 共 ${items.length} 項待處理</p>
    </div>
    ${sections}
    <p style="margin-top:24px;padding-top:12px;border-top:1px solid #eee;color:#999;font-size:12px;">點開連結直接到對應頁面處理。系統自動發送，每日一封。</p>
  </div>`

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipients,
    subject: `[CRM 提醒] ${new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Taipei' })} · ${items.length} 項待處理`,
    html,
  })

  if (error) return { skipped: false, sent: false, error: error.message }
  return { skipped: false, sent: true, id: data?.id }
}

function typeLabel(type: string) {
  switch (type) {
    case 'contract_expiring': return '合約到期'
    case 'payment_upgrade': return '收款升級'
    case 'kyc_overdue': return 'KYC 超時'
    case 'court_doc': return '法院文書'
    default: return type
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
