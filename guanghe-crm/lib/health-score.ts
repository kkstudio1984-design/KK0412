// ── 客戶健康度評分 ──────────────────────────────────────────
// 從 100 分起跳，依以下訊號扣分；得到分數後對應紅／黃／綠標籤。
// 設計原則：
//   1. 越早預警越好 — 一旦逾期就有訊號，不是出大事才警示
//   2. 重複扣分要設 cap — 避免一個客戶被一條訊號扣到負分失真
//   3. 已結案／已流失直接視為「不在追蹤範圍」(closed)，不參與紅黃綠

export type HealthLevel = 'healthy' | 'attention' | 'risk' | 'closed'

export interface HealthFactor {
  /** 短描述，會直接顯示在 UI 上 */
  label: string
  /** 扣分（負數）或加分（正數） */
  delta: number
}

export interface HealthScore {
  /** 0–100，已結案／已流失統一回 0 */
  score: number
  /** 等級 */
  level: HealthLevel
  /** 文字標籤 */
  levelLabel: string
  /** 顏色 hex（給 UI 直接用） */
  color: string
  /** 扣分／加分細項，按影響大小排序 */
  factors: HealthFactor[]
  /** 一句話建議下一步 */
  suggestion: string
}

interface ScoreInputs {
  stage: string | null | undefined
  payments?: Array<{
    status: string | null
    escalation_level: string | null
    due_date: string | null
    paid_at: string | null
  }>
  contracts?: Array<{
    end_date: string | null
    signing_status: string | null
  }>
  kycChecks?: Array<{
    status: string | null
    checked_at: string | null
  }>
  /** 客戶最後更新時間（用來判斷 KYC 卡關天數） */
  clientUpdatedAt?: string | null
}

const LEVEL_META: Record<HealthLevel, { label: string; color: string }> = {
  healthy:   { label: '健康', color: '#15803d' },
  attention: { label: '注意', color: '#b45309' },
  risk:      { label: '危險', color: '#b91c1c' },
  closed:    { label: '已結案', color: '#78716c' },
}

const CLOSED_STAGES = new Set(['已結案', '已流失'])

const ESCALATION_PENALTY: Record<string, number> = {
  '正常': 0,
  '提醒': -5,
  '催告': -15,
  '存證信函': -30,
  '退租啟動': -50,
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000)
}

export function computeHealthScore(inputs: ScoreInputs): HealthScore {
  // 已結案 / 已流失 → 直接返回 closed
  if (inputs.stage && CLOSED_STAGES.has(inputs.stage)) {
    return {
      score: 0,
      level: 'closed',
      levelLabel: LEVEL_META.closed.label,
      color: LEVEL_META.closed.color,
      factors: [],
      suggestion: '此客戶已結案／流失，不需主動聯繫。',
    }
  }

  const factors: HealthFactor[] = []
  let score = 100
  const now = new Date()

  // ── 1. 收款狀態 ────────────────────────────────────────
  const payments = inputs.payments || []
  const overduePayments = payments.filter(p => p.status === '逾期')
  if (overduePayments.length > 0) {
    const penalty = Math.max(-30, overduePayments.length * -10)
    factors.push({ label: `${overduePayments.length} 筆款項逾期`, delta: penalty })
    score += penalty
  }

  // ── 2. 升級層級（取最高的那個）─────────────────────────
  let highestEscalation: string | null = null
  let highestEscalationPenalty = 0
  for (const p of payments) {
    const lvl = p.escalation_level || '正常'
    const penalty = ESCALATION_PENALTY[lvl] ?? 0
    if (penalty < highestEscalationPenalty) {
      highestEscalationPenalty = penalty
      highestEscalation = lvl
    }
  }
  if (highestEscalation && highestEscalationPenalty < 0) {
    factors.push({ label: `升級至「${highestEscalation}」`, delta: highestEscalationPenalty })
    score += highestEscalationPenalty
  }

  // ── 3. KYC 卡關（最近一筆是審核中且 > 7 天）─────────────
  const kyc = inputs.kycChecks || []
  const inProgress = kyc.find(k => k.status === '審核中')
  if (inProgress && inputs.clientUpdatedAt) {
    const daysSince = daysBetween(now, new Date(inputs.clientUpdatedAt))
    if (daysSince > 7) {
      factors.push({ label: `KYC 卡關 ${daysSince} 天`, delta: -15 })
      score -= 15
    }
  }

  // ── 4. 合約 30 天內到期 ─────────────────────────────────
  const contracts = inputs.contracts || []
  const upcoming = contracts.filter(c => {
    if (!c.end_date) return false
    const days = daysBetween(new Date(c.end_date), now)
    return days >= 0 && days <= 30
  })
  if (upcoming.length > 0) {
    factors.push({ label: '有合約 30 天內到期', delta: -10 })
    score -= 10
  }

  // ── 5. 拒簽紀錄（曾拒簽且未補簽）─────────────────────────
  const rejected = contracts.filter(c => c.signing_status === '已拒絕')
  const signed = contracts.filter(c => c.signing_status === '已簽署')
  if (rejected.length > 0 && signed.length === 0) {
    factors.push({ label: '曾拒簽合約且尚未補簽', delta: -15 })
    score -= 15
  }

  // ── 6. 完全沒有合約資料 ─────────────────────────────────
  if (contracts.length === 0 && inputs.stage !== '潛在' && inputs.stage !== '洽談中') {
    factors.push({ label: '尚無合約紀錄', delta: -5 })
    score -= 5
  }

  // 把 factors 按影響大小排序（最嚴重的在最上）
  factors.sort((a, b) => a.delta - b.delta)

  // 邊界保護
  score = Math.max(0, Math.min(100, score))

  let level: HealthLevel
  if (score >= 80) level = 'healthy'
  else if (score >= 60) level = 'attention'
  else level = 'risk'

  const meta = LEVEL_META[level]

  // 一句話建議：根據最大扣分項決定
  const top = factors[0]
  let suggestion = '客戶狀態良好，維持目前服務節奏即可。'
  if (level === 'risk' && top) {
    suggestion = `風險訊號「${top.label}」需要立刻聯繫客戶處理。`
  } else if (level === 'attention' && top) {
    suggestion = `注意「${top.label}」，本週內主動聯繫一次。`
  }

  return {
    score,
    level,
    levelLabel: meta.label,
    color: meta.color,
    factors,
    suggestion,
  }
}
