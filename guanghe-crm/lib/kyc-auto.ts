// ── KYC 自動化（商工登記 / 司法院 / 動產擔保 / Google / 實質受益人）─────
// P1-3 from guanghe-crm 上線前優化清單。
//
// 目前迭代：只實作商工登記（g0v 公開 API、零 config、立刻可用）。
// 其他四項先標記「auto_pending」、等下次迭代再補：
//   - 司法院裁判書：scrape https://judgment.judicial.gov.tw（中等難度）
//   - 動產擔保：scrape 經濟部商業司 https://gcis.nat.gov.tw（中等難度）
//   - Google 搜尋：需 SerpAPI / Google CSE API key（要付費）
//   - 實質受益人審查：台灣無公開 API、需查商業司「實質受益人專區」（高難度）
//
// 使用方式：
//   POST /api/kyc/auto-check/{spaceClientId}
//   → 自動跑商工登記、結果寫進 kyc_checks 表、回傳所有 check 狀態。

import type { SupabaseClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────

export type KycCheckType = '商工登記' | '司法院裁判書' | '動產擔保' | 'Google搜尋' | '實質受益人審查'
export type KycStatus = '通過' | '異常' | '待查'

interface KycCheckResult {
  check_type: KycCheckType
  status: KycStatus
  details?: unknown
  data_source?: string
  override_reason?: string
}

// ── 商工登記（g0v API）──────────────────────────────────────────────

interface G0vCompanyData {
  公司名稱?: string
  公司現況?: string
  公司現況註記?: string[]
  代表人姓名?: string
  公司所在地?: string
  登記機關?: string
  核准設立日期?: { year: number; month: number; day: number }
  最後核准變更日期?: { year: number; month: number; day: number }
  資本總額?: string
  實收資本額?: string
  所營事業資料?: [string, string][]
}

async function checkCompanyRegistration(taxId: string): Promise<KycCheckResult> {
  const url = `https://company.g0v.ronny.tw/api/show/${encodeURIComponent(taxId)}`

  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'guanghe-crm/1.0' } })

    if (!resp.ok) {
      return {
        check_type: '商工登記',
        status: '待查',
        data_source: 'g0v-api',
        details: { error: `HTTP ${resp.status}`, taxId },
      }
    }

    const json = await resp.json() as { data?: G0vCompanyData; error?: string }

    if (!json.data || json.error) {
      return {
        check_type: '商工登記',
        status: '異常',
        data_source: 'g0v-api',
        details: { error: json.error || '查無此統編', taxId },
        override_reason: `g0v 商工登記查無統編 ${taxId}`,
      }
    }

    const data = json.data
    const status = data.公司現況 || ''

    // 「核准設立」算通過；「解散」「停業」「撤銷」「廢止」算異常；其他算待查（人工確認）
    let kycStatus: KycStatus = '待查'
    let overrideReason: string | undefined = undefined
    const flags: string[] = []

    if (status.includes('核准設立')) {
      kycStatus = '通過'
    } else if (
      status.includes('解散') ||
      status.includes('停業') ||
      status.includes('撤銷') ||
      status.includes('廢止') ||
      status.includes('歇業')
    ) {
      kycStatus = '異常'
      flags.push(`公司現況：${status}`)
      overrideReason = `公司現況非「核准設立」：${status}`
    } else {
      flags.push(`公司現況：${status || '未知'}`)
    }

    // 資本額過低警示（< 100 萬可能是空殼）— 不直接判異常、留人工 review
    const realCapital = parseInt((data.實收資本額 || '0').replace(/[^\d]/g, ''), 10)
    if (realCapital > 0 && realCapital < 1_000_000) {
      flags.push(`實收資本額偏低：${realCapital.toLocaleString()} 元`)
    }

    return {
      check_type: '商工登記',
      status: kycStatus,
      data_source: 'g0v-api',
      details: {
        companyName: data.公司名稱,
        representative: data.代表人姓名,
        address: data.公司所在地,
        registrationStatus: status,
        capitalTotal: data.資本總額,
        capitalReceived: data.實收資本額,
        establishedAt: data.核准設立日期,
        lastModifiedAt: data.最後核准變更日期,
        registrationAuthority: data.登記機關,
        businessItems: (data.所營事業資料 || []).slice(0, 10).map((it) => it[1]),
        flags,
      },
      override_reason: overrideReason,
    }
  } catch (e: unknown) {
    return {
      check_type: '商工登記',
      status: '待查',
      data_source: 'g0v-api',
      details: { error: e instanceof Error ? e.message : String(e), taxId },
    }
  }
}

// ── 其他四項暫留 stub ─────────────────────────────────────────────────

function checkJudicialJudgment(): KycCheckResult {
  return {
    check_type: '司法院裁判書',
    status: '待查',
    data_source: 'manual',
    details: { note: '自動爬蟲待實作（judgment.judicial.gov.tw）。請光光手動搜尋公司名稱與代表人姓名。' },
  }
}

function checkChattelMortgage(): KycCheckResult {
  return {
    check_type: '動產擔保',
    status: '待查',
    data_source: 'manual',
    details: { note: '自動爬蟲待實作（gcis.nat.gov.tw 動產擔保查詢）。請光光手動查詢。' },
  }
}

function checkGoogleSearch(): KycCheckResult {
  return {
    check_type: 'Google搜尋',
    status: '待查',
    data_source: 'manual',
    details: { note: '需 SerpAPI / Google CSE API key 才能自動跑（要付費）。請光光手動 Google 公司名稱 + 代表人姓名 + 統編、看有無負面新聞。' },
  }
}

function checkBeneficialOwner(): KycCheckResult {
  return {
    check_type: '實質受益人審查',
    status: '待查',
    data_source: 'manual',
    details: { note: '台灣商業司「實質受益人專區」無公開 API。請光光至 https://findbiz.nat.gov.tw 手動查詢實質受益人名單、確認非高風險個人。' },
  }
}

// ── Main entry ────────────────────────────────────────────────────────

interface RunOptions {
  spaceClientId: string
  taxId: string
  supabase: SupabaseClient
}

export interface RunResult {
  spaceClientId: string
  checks: KycCheckResult[]
  passed: number
  flagged: number
  pending: number
}

/**
 * 對 space_client 跑全套自動 KYC、寫入 kyc_checks 表、回傳結果摘要。
 *
 * idempotent：同一 space_client 重複跑會 upsert 同 check_type 的 row（不會堆積一堆 row）。
 */
export async function runAutoKyc(opts: RunOptions): Promise<RunResult> {
  const { spaceClientId, taxId, supabase } = opts

  // 1. 商工登記（real API call）
  const registration = await checkCompanyRegistration(taxId)

  // 2. 其他四項（stubs）
  const judicial = checkJudicialJudgment()
  const chattel = checkChattelMortgage()
  const google = checkGoogleSearch()
  const beneficialOwner = checkBeneficialOwner()

  const checks = [registration, judicial, chattel, google, beneficialOwner]

  // 3. Upsert 進 kyc_checks 表
  // 因為 kyc_checks 沒 unique constraint on (space_client_id, check_type)、用「先 delete 後 insert」確保 idempotency
  await supabase
    .from('kyc_checks')
    .delete()
    .eq('space_client_id', spaceClientId)
    .in('check_type', checks.map((c) => c.check_type))

  await supabase.from('kyc_checks').insert(
    checks.map((c) => ({
      space_client_id: spaceClientId,
      check_type: c.check_type,
      status: c.status,
      override_reason: c.override_reason || null,
      details: c.details || null,
      data_source: c.data_source || null,
      auto_checked: c.data_source !== 'manual',
    }))
  )

  return {
    spaceClientId,
    checks,
    passed: checks.filter((c) => c.status === '通過').length,
    flagged: checks.filter((c) => c.status === '異常').length,
    pending: checks.filter((c) => c.status === '待查').length,
  }
}
