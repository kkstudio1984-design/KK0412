import { Resend } from 'resend'

type NotificationItem = {
  title: string
  message: string
  type: string
  link?: string
}

type Severity = 'urgent' | 'warning' | 'info'

const PRODUCTION_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://guanghe-crm.vercel.app'
const FROM_ADDRESS = process.env.EMAIL_FROM || '光合創學 CRM <onboarding@resend.dev>'

const SEVERITY_ORDER: Severity[] = ['urgent', 'warning', 'info']

const SEVERITY_STYLE: Record<Severity, { label: string; color: string; bg: string; emoji: string }> = {
  urgent:  { label: '急件',   color: '#b91c1c', bg: '#fef2f2', emoji: '🔴' },
  warning: { label: '注意',   color: '#b45309', bg: '#fffbeb', emoji: '🟠' },
  info:    { label: '一般',   color: '#1e40af', bg: '#eff6ff', emoji: '🔵' },
}

function asSeverity(type: string): Severity {
  return type === 'urgent' || type === 'warning' || type === 'info' ? type : 'info'
}

export async function sendDailyDigest(items: NotificationItem[]) {
  const apiKey = process.env.RESEND_API_KEY
  const recipients = (process.env.NOTIFICATION_RECIPIENTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!apiKey || recipients.length === 0 || items.length === 0) {
    return { skipped: true, reason: !apiKey ? 'no_api_key' : recipients.length === 0 ? 'no_recipients' : 'no_items' }
  }

  const grouped: Record<Severity, NotificationItem[]> = { urgent: [], warning: [], info: [] }
  for (const n of items) grouped[asSeverity(n.type)].push(n)

  const urgentCount = grouped.urgent.length
  const warningCount = grouped.warning.length

  const sections = SEVERITY_ORDER.flatMap((sev) => {
    const list = grouped[sev]
    if (list.length === 0) return []
    const style = SEVERITY_STYLE[sev]
    const rows = list
      .map((n) => {
        const link = n.link ? `${PRODUCTION_URL}${n.link}` : null
        const titleHtml = link
          ? `<a href="${link}" style="color:${style.color};text-decoration:none;font-weight:600;">${escapeHtml(n.title)}</a>`
          : `<strong style="color:${style.color};">${escapeHtml(n.title)}</strong>`
        return `<li style="margin-bottom:10px;line-height:1.5;">${titleHtml}<br><span style="color:#555;font-size:13px;">${escapeHtml(n.message)}</span></li>`
      })
      .join('')
    return [
      `<div style="background:${style.bg};border-left:4px solid ${style.color};padding:14px 18px;margin:16px 0;border-radius:4px;">
         <div style="color:${style.color};font-weight:700;font-size:14px;margin-bottom:10px;">${style.emoji} ${style.label}（${list.length} 項）</div>
         <ul style="padding-left:18px;margin:0;">${rows}</ul>
       </div>`,
    ]
  }).join('')

  const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Taipei' })

  const html = `<div style="font-family:-apple-system,'PingFang TC','Microsoft JhengHei',sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#0a0a0a;background:#fff;">
    <div style="border-bottom:2px solid #d97706;padding-bottom:12px;margin-bottom:8px;">
      <h2 style="margin:0;font-size:18px;">光合創學 CRM 每日提醒</h2>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">${dateStr} · 共 ${items.length} 項${urgentCount > 0 ? `（含 <strong style="color:#b91c1c;">${urgentCount} 項急件</strong>）` : ''}</p>
    </div>
    ${sections}
    <p style="margin-top:24px;padding-top:12px;border-top:1px solid #eee;color:#999;font-size:12px;">點開連結直接到對應頁面處理。系統每日 5:00 自動發送，沒有事件不寄。</p>
  </div>`

  const subject = (() => {
    const dateShort = new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: 'Asia/Taipei' })
    if (urgentCount > 0) return `🔴 ${dateShort} ${urgentCount} 件急件 + ${items.length - urgentCount} 件待處理`
    if (warningCount > 0) return `🟠 ${dateShort} ${warningCount} 件注意 + ${items.length - warningCount} 件一般`
    return `[CRM 提醒] ${dateShort} · ${items.length} 件待處理`
  })()

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: recipients,
    subject,
    html,
  })

  if (error) return { skipped: false, sent: false, error: error.message }
  return { skipped: false, sent: true, id: data?.id }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
