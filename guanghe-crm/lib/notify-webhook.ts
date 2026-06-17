// ── Notification Webhook（LINE / Slack / Discord 通用）─────────────
// 對接外部即時訊息服務、重要事件發生時主動推訊息給光光跟 Miu。
//
// 設計：service-agnostic — 不綁定特定服務，只要對方支援「POST JSON body」即可。
// 兩家相容：
//   Slack incoming webhook → POST { text } 到 webhook URL
//   Discord webhook → POST { content } 到 webhook URL
//
// LINE 未實作：LINE Notify v2 已於 2025/3 deprecated、Messaging API push
// message 需要 channel access token + Authorization header + to (user/group
// ID)、不適合走通用 webhook 模式。需要 LINE 推送請另寫 lib/notify-line.ts。
//
// 環境變數：
//   NOTIFY_WEBHOOK_URL：webhook endpoint URL
//   NOTIFY_WEBHOOK_FORMAT：'slack' | 'discord'（決定 body 格式）
//
// Graceful fallback：沒設 env 時靜默 return null、不影響主流程。
//
// 接入點建議（光光可選擇要加哪幾條）：
//   合約簽妥 / 合約被拒 / KYC 異常 / 收款逾期紅燈 / 客戶健康度降紅 /
//   月報寄出完成 / 學員入庫 / cron 失敗

const WEBHOOK_URL = process.env.NOTIFY_WEBHOOK_URL
const WEBHOOK_FORMAT = (process.env.NOTIFY_WEBHOOK_FORMAT || 'slack') as 'slack' | 'discord'

const EVENT_EMOJI: Record<string, string> = {
  contract_signed: '✅',
  contract_rejected: '❌',
  kyc_flagged: '⚠️',
  payment_overdue: '🔴',
  health_red: '🚨',
  monthly_report_sent: '📊',
  student_added: '🌱',
  cron_failed: '💥',
  generic: '🔔',
}

interface NotifyInput {
  event:
    | 'contract_signed'
    | 'contract_rejected'
    | 'kyc_flagged'
    | 'payment_overdue'
    | 'health_red'
    | 'monthly_report_sent'
    | 'student_added'
    | 'cron_failed'
    | 'generic'
  title: string
  message: string
  link?: string
}

interface NotifyResult {
  sent: boolean
  status?: number
  error?: string
}

export async function notifyWebhook(input: NotifyInput): Promise<NotifyResult | null> {
  if (!WEBHOOK_URL) {
    // Dev / preview 安全網：沒設 webhook URL → 靜默 skip、不丟錯、不阻塞主流程
    return null
  }

  const emoji = EVENT_EMOJI[input.event] || EVENT_EMOJI.generic
  const linkSuffix = input.link ? `\n${input.link}` : ''
  const fullMessage = `${emoji} *${input.title}*\n${input.message}${linkSuffix}`

  let body: object
  switch (WEBHOOK_FORMAT) {
    case 'discord':
      body = { content: fullMessage.replace(/\*/g, '**') } // Discord 用 ** 粗體
      break
    case 'slack':
    default:
      body = { text: fullMessage, mrkdwn: true }
      break
  }

  try {
    const resp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!resp.ok) {
      return { sent: false, status: resp.status, error: `webhook ${resp.status}` }
    }
    return { sent: true, status: resp.status }
  } catch (e: unknown) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) }
  }
}
