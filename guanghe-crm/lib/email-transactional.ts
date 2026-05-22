// ── Email helper ──────────────────────────────────────────────
// 從 email_templates 表讀範本、做變數替換、用 Resend 寄出，
// 並把結果寫入 email_logs 表方便日後追蹤。
//
// Graceful fallback：
//   未設 RESEND_API_KEY 時，狀態標 'skipped'，console.warn 提示，不會丟錯誤。
//   這讓 dev / preview 環境可以安心跑 cron 不會誤發信給真實客戶。

import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'

interface SendOptions {
  /** email_templates.template_key */
  templateKey: string
  /** 收件人 email */
  to: string
  /** 收件人姓名（可選） */
  toName?: string
  /** 變數替換對照表，例如 { client_name: '光合', amount: '5000' } */
  variables?: Record<string, string | number | null | undefined>
  /** 觸發來源（追蹤用） */
  related?: { table: string; id: string }
  /** Supabase client（由呼叫者提供，避免重複建立） */
  supabase: SupabaseClient
}

interface SendResult {
  status: 'sent' | 'failed' | 'skipped'
  messageId?: string
  error?: string
  logId?: string
}

// 不再 fallback 到 vercel.app domain — 那不在 Resend 驗證 list、Resend 會直接拒寄、
// 且 Vercel 自動 domain 沒 SPF/DKIM 設定、收件方一律進垃圾信。
// EMAIL_FROM 必須由部署環境設為已在 Resend Dashboard 驗證的自有 domain，例如
// `光合創學 <noreply@guanghexueshe.com.tw>`。沒設則所有對外信走 skipped 不寄。
const FROM = process.env.EMAIL_FROM

/**
 * 把 'Hello {{name}}, due {{amount}}' 用 variables 物件替換。
 * 缺值的變數保留原樣，不報錯（讓 raw template 可以肉眼除錯）。
 */
function fillTemplate(text: string, variables: Record<string, string | number | null | undefined> = {}): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const v = variables[key]
    return v === null || v === undefined ? `{{${key}}}` : String(v)
  })
}

export async function sendTemplatedEmail(opts: SendOptions): Promise<SendResult> {
  const { templateKey, to, toName, variables = {}, related, supabase } = opts

  // 1. 找範本
  const { data: tmpl, error: tmplErr } = await supabase
    .from('email_templates')
    .select('id, subject, body, is_active')
    .eq('template_key', templateKey)
    .single()

  if (tmplErr || !tmpl) {
    return await logAndReturn(supabase, {
      to, toName, related, templateKey,
      subject: `[範本不存在] ${templateKey}`,
      bodyPreview: '',
      status: 'failed',
      error: `template not found: ${templateKey}`,
    })
  }
  if (tmpl.is_active === false) {
    return await logAndReturn(supabase, {
      to, toName, related, templateKey,
      subject: tmpl.subject,
      bodyPreview: '',
      status: 'skipped',
      error: 'template inactive',
    })
  }

  // 2. 變數替換
  const subject = fillTemplate(tmpl.subject, variables)
  const body = fillTemplate(tmpl.body, variables)

  // 3. 沒設 Resend key 或沒設 EMAIL_FROM → 跳過寄送但留記錄（dev / preview 安全網）
  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = FROM
  if (!apiKey || !fromAddress) {
    if (!apiKey) console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to} (template=${templateKey})`)
    if (!fromAddress) console.error(`[email] EMAIL_FROM not set — refusing to send to ${to} (template=${templateKey}, must be Resend-verified domain)`)
    return await logAndReturn(supabase, {
      to, toName, related, templateKey, subject,
      bodyPreview: body.slice(0, 500),
      status: 'skipped',
      error: !apiKey ? 'RESEND_API_KEY not configured' : 'EMAIL_FROM not configured',
    })
  }

  // 4. 寄出
  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toName ? `${toName} <${to}>` : to,
      subject,
      text: body,
    })
    if (error) {
      return await logAndReturn(supabase, {
        to, toName, related, templateKey, subject,
        bodyPreview: body.slice(0, 500),
        status: 'failed',
        error: error.message || JSON.stringify(error),
      })
    }
    return await logAndReturn(supabase, {
      to, toName, related, templateKey, subject,
      bodyPreview: body.slice(0, 500),
      status: 'sent',
      messageId: data?.id,
    })
  } catch (e: unknown) {
    return await logAndReturn(supabase, {
      to, toName, related, templateKey, subject,
      bodyPreview: body.slice(0, 500),
      status: 'failed',
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

interface InlineSendOptions {
  to: string
  toName?: string
  subject: string
  /** HTML body — Resend 主推 */
  html: string
  /** Plain-text fallback；若不提供，會自動從 html 簡單 strip */
  text?: string
  /** 觸發來源（追蹤用） */
  related?: { table: string; id: string }
  /** Email log 用的識別字串，例如 'monthly_report_2026_04' */
  logKey?: string
  supabase: SupabaseClient
}

/**
 * 不走 email_templates 表、直接傳 subject + html 寄信。
 * 適合月報、自動產生報表這種「動態組裝、不需重複使用」的場景。
 */
export async function sendInlineEmail(opts: InlineSendOptions): Promise<SendResult> {
  const { to, toName, subject, html, text, related, logKey, supabase } = opts
  const previewText = text ?? html.replace(/<[^>]*>/g, '').slice(0, 500)

  const apiKey = process.env.RESEND_API_KEY
  const fromAddress = FROM
  if (!apiKey || !fromAddress) {
    if (!apiKey) console.warn(`[email] RESEND_API_KEY not set — skipping inline send to ${to} (subject=${subject})`)
    if (!fromAddress) console.error(`[email] EMAIL_FROM not set — refusing to inline send to ${to} (subject=${subject}, must be Resend-verified domain)`)
    return await logAndReturn(supabase, {
      to, toName, related, templateKey: logKey || 'inline',
      subject, bodyPreview: previewText.slice(0, 500),
      status: 'skipped',
      error: !apiKey ? 'RESEND_API_KEY not configured' : 'EMAIL_FROM not configured',
    })
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: toName ? `${toName} <${to}>` : to,
      subject,
      html,
      text: text ?? previewText,
    })
    if (error) {
      return await logAndReturn(supabase, {
        to, toName, related, templateKey: logKey || 'inline',
        subject, bodyPreview: previewText.slice(0, 500),
        status: 'failed',
        error: error.message || JSON.stringify(error),
      })
    }
    return await logAndReturn(supabase, {
      to, toName, related, templateKey: logKey || 'inline',
      subject, bodyPreview: previewText.slice(0, 500),
      status: 'sent',
      messageId: data?.id,
    })
  } catch (e: unknown) {
    return await logAndReturn(supabase, {
      to, toName, related, templateKey: logKey || 'inline',
      subject, bodyPreview: previewText.slice(0, 500),
      status: 'failed',
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

interface LogParams {
  to: string
  toName?: string
  templateKey: string
  subject: string
  bodyPreview: string
  status: 'sent' | 'failed' | 'skipped'
  messageId?: string
  error?: string
  related?: { table: string; id: string }
}

async function logAndReturn(supabase: SupabaseClient, p: LogParams): Promise<SendResult> {
  try {
    const { data: logRow } = await supabase
      .from('email_logs')
      .insert({
        to_email: p.to,
        to_name: p.toName || null,
        subject: p.subject,
        template_key: p.templateKey,
        body_preview: p.bodyPreview,
        related_table: p.related?.table || null,
        related_id: p.related?.id || null,
        status: p.status,
        provider: 'resend',
        provider_message_id: p.messageId || null,
        error_message: p.error || null,
        sent_at: p.status === 'sent' ? new Date().toISOString() : null,
      })
      .select('id')
      .single()
    return {
      status: p.status,
      messageId: p.messageId,
      error: p.error,
      logId: (logRow as any)?.id,
    }
  } catch (logErr) {
    // 寫 log 也壞了 — 不要拖累主流程，回傳結果即可
    console.error('[email] failed to write email_logs:', logErr)
    return { status: p.status, messageId: p.messageId, error: p.error }
  }
}
