// ── Customer Portal Token ─────────────────────────────────────
// 客戶自助 Portal magic link 機制（P2-1）。
//
// 設計：
//   admin 為每個 space_client 產一個 random URL-safe token、寫入
//   portal_tokens 表、有效期預設 30 天、客戶用 /portal/[token] 進來
//   自己看合約 / 繳款 / KYC / 月報預告。
//
// 安全模型：
//   - Token 43 chars URL-safe random（256-bit entropy、不可暴力猜）
//   - 沒有 IP 黏定、沒有單次使用 — 客戶可能換裝置看、多次重看
//   - 30 天 TTL（可在生成時客製）、過期需 admin 重發
//   - 撤銷：admin 在 UI 刪除 token row 即立刻失效
//   - 不適合放高機密資料（不像金流支付授權）— portal 顯示的是客戶
//     自己已知的資料、不會擴大 attack surface

import crypto from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Service-role client for portal_tokens R/W ─────────────────
// portal 頁面訪客是 unauthenticated、需要繞 RLS 讀 token / 客戶資料。
// admin 端產生 token 走 user-context client 即可（RLS 已限 admin/operator）。
function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      '[portal] SUPABASE_SERVICE_ROLE_KEY required for portal token validation. ' +
        'Set it in Vercel env.'
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ── Token generation ─────────────────────────────────────────

export interface GenerateTokenInput {
  spaceClientId: string
  /** TTL in days, default 30 */
  ttlDays?: number
  /** Admin notes for this token (e.g. "寄給嚴總 6/17") */
  notes?: string
  /** Admin user_id (from auth context) */
  createdBy?: string
  /** Authenticated supabase client (admin context) */
  supabase: SupabaseClient
}

export interface GenerateTokenResult {
  token: string
  url: string
  expiresAt: string
}

/**
 * Generate a new portal token for a space_client.
 * Called from admin UI / API after auth check.
 */
export async function generatePortalToken(opts: GenerateTokenInput): Promise<GenerateTokenResult> {
  const ttlDays = opts.ttlDays ?? 30
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  const { error } = await opts.supabase.from('portal_tokens').insert({
    token,
    space_client_id: opts.spaceClientId,
    expires_at: expiresAt.toISOString(),
    notes: opts.notes || null,
    created_by: opts.createdBy || null,
  })

  if (error) {
    throw new Error(`Failed to create portal token: ${error.message}`)
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://guanghe-crm.vercel.app'

  return {
    token,
    url: `${baseUrl}/portal/${token}`,
    expiresAt: expiresAt.toISOString(),
  }
}

// ── Token validation ─────────────────────────────────────────

export interface ValidatedToken {
  spaceClientId: string
  expiresAt: string
  accessCount: number
}

/**
 * Validate a portal token. Used by /portal/[token] page (Server Component).
 * Returns null if token doesn't exist or has expired.
 * Side effect: increments access_count + updates first/last_accessed_at.
 */
export async function validatePortalToken(token: string): Promise<ValidatedToken | null> {
  const supabase = getServiceRoleClient()

  const { data: row, error } = await supabase
    .from('portal_tokens')
    .select('token, space_client_id, expires_at, access_count, first_accessed_at')
    .eq('token', token)
    .single()

  if (error || !row) return null

  // Expiry check
  if (new Date(row.expires_at) < new Date()) {
    return null
  }

  // Update access tracking (fire and forget — don't block render on this)
  const now = new Date().toISOString()
  void supabase
    .from('portal_tokens')
    .update({
      access_count: row.access_count + 1,
      last_accessed_at: now,
      first_accessed_at: row.first_accessed_at || now,
    })
    .eq('token', token)
    .then(() => {
      // intentionally not awaited
    })

  return {
    spaceClientId: row.space_client_id,
    expiresAt: row.expires_at,
    accessCount: row.access_count,
  }
}

// ── Portal data fetchers ────────────────────────────────────
// 由 /portal/[token]/page.tsx Server Component 呼叫、用 service-role
// client 繞 RLS 讀客戶資料。

export interface PortalData {
  client: {
    orgName: string
    contactName: string
    serviceType: string
    stage: string
  }
  contract: {
    type: string
    startDate: string
    endDate: string
    monthlyRent: number
    paymentCycle: string
    depositStatus: string
    isNotarized: boolean
  } | null
  payments: Array<{
    dueDate: string
    amount: number
    status: string
    paidAt: string | null
  }>
  kyc: Array<{
    checkType: string
    status: string
    checkedAt: string | null
  }>
  monthlyReport: {
    lastSentAt: string | null
    nextEstimatedAt: string
  }
}

export async function fetchPortalData(spaceClientId: string): Promise<PortalData | null> {
  const supabase = getServiceRoleClient()

  // 1. Client + Organization
  const { data: client } = await supabase
    .from('space_clients')
    .select('id, service_type, stage, org_id, organizations(name, contact_name)')
    .eq('id', spaceClientId)
    .single()

  if (!client) return null

  // 2. Active contract (latest)
  const { data: contract } = await supabase
    .from('contracts')
    .select('contract_type, start_date, end_date, monthly_rent, payment_cycle, deposit_status, is_notarized')
    .eq('space_client_id', spaceClientId)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  // 3. Payments (last 12 entries)
  const { data: payments } = await supabase
    .from('payments')
    .select('due_date, amount, status, paid_at')
    .eq('space_client_id', spaceClientId)
    .order('due_date', { ascending: false })
    .limit(12)

  // 4. KYC checks
  const { data: kyc } = await supabase
    .from('kyc_checks')
    .select('check_type, status, checked_at')
    .eq('space_client_id', spaceClientId)
    .order('checked_at', { ascending: false, nullsFirst: false })

  // 5. Next monthly report estimate
  //    monthly-report cron schedule: vercel.json "0 9 * * *" daily check、寄當月 1 號
  //    估算下次寄送日 = 下個月 1 號 09:00 台北
  const now = new Date()
  const nextMonthFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0)

  const org = Array.isArray(client.organizations) ? client.organizations[0] : client.organizations

  return {
    client: {
      orgName: org?.name || '（未知）',
      contactName: org?.contact_name || '',
      serviceType: client.service_type,
      stage: client.stage,
    },
    contract: contract
      ? {
          type: contract.contract_type,
          startDate: contract.start_date,
          endDate: contract.end_date,
          monthlyRent: contract.monthly_rent,
          paymentCycle: contract.payment_cycle,
          depositStatus: contract.deposit_status,
          isNotarized: contract.is_notarized,
        }
      : null,
    payments: (payments || []).map((p) => ({
      dueDate: p.due_date,
      amount: p.amount,
      status: p.status,
      paidAt: p.paid_at,
    })),
    kyc: (kyc || []).map((k) => ({
      checkType: k.check_type,
      status: k.status,
      checkedAt: k.checked_at,
    })),
    monthlyReport: {
      lastSentAt: null, // TODO: 等 monthly-report 表上線後讀
      nextEstimatedAt: nextMonthFirst.toISOString(),
    },
  }
}
