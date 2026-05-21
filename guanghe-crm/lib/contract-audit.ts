// ── Contract signing audit helpers ───────────────────────────────────
// 用於 /api/sign/[token] 簽署成功時計算合約 hash + 簽名圖 hash，
// 寫入 contract_signing_audit 表作為「簽名當下合約內容快照」存證。
//
// 設計原則：
//   - 用 stable JSON serialization 確保同樣的合約欄位永遠 hash 出同一個值
//   - SHA-256 + hex output（128 字、SQL TEXT 欄位友善、肉眼可讀）
//   - 不引入第三方時戳服務（綠界存證 / 區塊鏈），純內部 hash 已足以辯駁
//     「事後修改」質疑（任何修改都會讓 audit log 的 contract_snapshot_hash
//     跟新版本算出來不一致）

import crypto from 'node:crypto'

/**
 * Stable JSON stringify — key 按字母排序，避免同樣資料因 key 順序不同產生不同 hash。
 * 巢狀物件也遞迴排序。
 */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']'
  }
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
}

/**
 * 計算合約欄位的 stable hash。
 *
 * 只 hash 「法律意義」的欄位：合約類型、起訖日期、月租、押金、付款週期、雙方資訊。
 * 不 hash 系統欄位（created_at、updated_at、signing_token 等）— 那些變動不影響法律效力。
 */
export function hashContract(contract: Record<string, unknown>): string {
  // 白名單法律意義欄位 — 任何一個改變都應該讓 hash 改變
  const legalFields = [
    'id',
    'contract_type',
    'start_date',
    'end_date',
    'monthly_rent',
    'payment_cycle',
    'deposit_amount',
    'leg_type',
    'space_client_id',
    'project_id',
    'lease_terms', // 條款內文（如果有）
  ]

  const snapshot: Record<string, unknown> = {}
  for (const key of legalFields) {
    if (key in contract) snapshot[key] = contract[key]
  }

  return crypto.createHash('sha256').update(stableStringify(snapshot)).digest('hex')
}

/**
 * 計算簽名圖的 hash。直接對 base64 字串本身做 SHA-256。
 * 如果 signatureImage 是 data URL（data:image/png;base64,xxx），會先抽出 base64 部分。
 */
export function hashSignature(signatureImage: string | null | undefined): string | null {
  if (!signatureImage) return null
  const base64Part = signatureImage.includes(',') ? signatureImage.split(',')[1] : signatureImage
  return crypto.createHash('sha256').update(base64Part).digest('hex')
}

/**
 * 估算簽名圖 base64 編碼前的原始 bytes 大小（粗略）。
 */
export function estimateSignatureBytes(signatureImage: string | null | undefined): number | null {
  if (!signatureImage) return null
  const base64Part = signatureImage.includes(',') ? signatureImage.split(',')[1] : signatureImage
  // base64 後大小 = 原始 bytes × 4/3，反推原始 bytes = base64 長度 × 3/4 - padding
  const padding = (base64Part.match(/=+$/)?.[0]?.length) ?? 0
  return Math.floor((base64Part.length * 3) / 4) - padding
}
