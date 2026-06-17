// ── Invoice (綠界電子發票 ECPay B2B/B2C) ─────────────────────────────
// 光合創學股份有限公司（統編 60350883）對外開立電子發票的統一介面。
//
// API 規格：https://developers.ecpay.com.tw/?p=24230（一般開立、作廢、查詢）
// 加密方式：AES-128-CBC + PKCS#7 + URL encode + Base64
//
// Graceful fallback：
//   未設 ECPAY_MERCHANT_ID / HASH_KEY / HASH_IV → 狀態回 'skipped'，console.error 提示
//   讓 dev / preview 環境跑 cron 不會誤開真實發票。
//
// 上線前 prerequisite（見 vault 40 課程/00 戰略/綠界電子發票串接 SOP.md）：
//   1. 光光到綠界 https://invoice.ecpay.com.tw 開戶申請電子發票服務
//   2. 取得 MerchantID / HashKey / HashIV、設進 Vercel env
//   3. 第一個發票字軌段號從綠界 Dashboard 申請、寫進 invoice_settings 表
//   4. 串到 receipt 列印頁與合約簽妥自動觸發

import crypto from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── Service-role client for invoices table writes ─────────────────────
// invoices RLS policy（migration 025）要求 auth.uid() 對應 profiles.role
// IN ('admin','operator') 才能 insert。cron / webhook 觸發 invoice 時
// auth.uid() 為 null、會被 RLS 拒絕 → 之前的 outer catch 會吞錯、ECPay
// 發票已開但 DB 沒紀錄、無法後續查詢／作廢。
//
// 解法：invoice 寫入永遠走 service-role client、繞 RLS。caller 不再
// 傳 SupabaseClient、降低誤用 user-context client 的可能。
function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      '[invoice] SUPABASE_SERVICE_ROLE_KEY required for invoices table write. ' +
        'Set it in Vercel env (Settings → Environment Variables → Production).'
    )
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ── Configuration ─────────────────────────────────────────────────────

const MERCHANT_ID = process.env.ECPAY_MERCHANT_ID
const HASH_KEY = process.env.ECPAY_HASH_KEY
const HASH_IV = process.env.ECPAY_HASH_IV

// 綠界測試環境公開 credentials（official sandbox）— 沒設 env 時自動用測試 key 跑 dry-run
const TEST_MERCHANT_ID = '2000132'
const TEST_HASH_KEY = '5294y06JbISpM5x9'
const TEST_HASH_IV = 'v77hoKGq4kWxNNIS'

// API_BASE 安全預設：依 MERCHANT_ID 是否為官方 sandbox 自動切換。
// 防呆：正式憑證 + 未設 ECPAY_INVOICE_API_BASE → 強制走 production URL、
// 不會誤把正式憑證打到 stage（會發出永遠不進財政部的 staging 發票）。
// 顯式設 ECPAY_INVOICE_API_BASE 仍可手動覆寫（測試特殊情境用）。
const isTestSandbox = MERCHANT_ID === TEST_MERCHANT_ID
const API_BASE =
  process.env.ECPAY_INVOICE_API_BASE ||
  (isTestSandbox
    ? 'https://einvoice-stage.ecpay.com.tw/B2CInvoice'
    : 'https://einvoice.ecpay.com.tw/B2CInvoice')

// ── Types ─────────────────────────────────────────────────────────────

export interface InvoiceItem {
  name: string
  count: number
  unit: string
  price: number // 單價（含稅）
  amount: number // 小計（含稅，通常 = count × price）
  remark?: string
}

export interface IssueInvoiceInput {
  /** 對方買受人公司名（B2B）或姓名（B2C）*/
  customerName: string
  /** 統一編號（B2B 必填、B2C 留空）*/
  customerIdentifier?: string
  /** 買受人地址（可空）*/
  customerAddr?: string
  /** 買受人 Email（用於寄送電子發票通知）*/
  customerEmail?: string
  /** 發票項目列表 */
  items: InvoiceItem[]
  /** 應稅 / 零稅 / 免稅，預設應稅 */
  taxType?: '1' | '2' | '3'
  /** 載具類型：'' 雲端發票存綠界、'1' 會員載具、'2' 自然人憑證、'3' 手機條碼 */
  carrierType?: '' | '1' | '2' | '3'
  carrierNum?: string
  /** 對應到 CRM 的訂單／合約 ID（追蹤用、會寫入 invoices.related_id）*/
  relatedTable?: string
  relatedId?: string
}

export interface InvoiceResult {
  status: 'issued' | 'failed' | 'skipped'
  invoiceNumber?: string
  invoiceDate?: string
  rawResponse?: unknown
  error?: string
  logId?: string
}

// ── AES-128-CBC + PKCS#7 helpers（綠界規格）──────────────────────────

function aesEncryptForEcpay(plaintext: string, key: string, iv: string): string {
  const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'))
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return encrypted.toString('base64')
}

function aesDecryptFromEcpay(ciphertext: string, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'))
  const decrypted = Buffer.concat([decipher.update(ciphertext, 'base64'), decipher.final()])
  return decrypted.toString('utf8')
}

/** 綠界規定整個 payload 先 URL encode 再 AES 加密 */
function buildEncryptedData(payload: Record<string, unknown>, key: string, iv: string): string {
  // 綠界 spec: 所有 special char 用 .NET HttpUtility.UrlEncode 風格（lowercase hex）
  // Node encodeURIComponent 預設大寫 hex，需轉小寫
  const urlEncoded = encodeURIComponent(JSON.stringify(payload)).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())
  return aesEncryptForEcpay(urlEncoded, key, iv)
}

function parseEncryptedResponse(encrypted: string, key: string, iv: string): unknown {
  const decoded = aesDecryptFromEcpay(encrypted, key, iv)
  // 對應 buildEncryptedData 的 URL encode、先 decode 再 JSON parse
  const decoded2 = decodeURIComponent(decoded)
  return JSON.parse(decoded2)
}

// ── Main API ──────────────────────────────────────────────────────────

/**
 * 開立電子發票。失敗不丟錯、寫入 invoices log、return failed/skipped 狀態。
 */
export async function issueInvoice(opts: IssueInvoiceInput): Promise<InvoiceResult> {
  const merchantId = MERCHANT_ID
  const hashKey = HASH_KEY
  const hashIv = HASH_IV

  // No production credentials → skipped (dev 安全網、不會誤開真實發票)
  if (!merchantId || !hashKey || !hashIv) {
    console.error(
      '[invoice] ECPAY_MERCHANT_ID / HASH_KEY / HASH_IV not all set — refusing to issue invoice. ' +
        'Set them in Vercel env after 光光 opens ECPay merchant account (see vault 綠界電子發票串接 SOP.md).'
    )
    return await logAndReturn({
      status: 'skipped',
      relatedTable: opts.relatedTable,
      relatedId: opts.relatedId,
      customerName: opts.customerName,
      customerIdentifier: opts.customerIdentifier,
      amount: opts.items.reduce((sum, i) => sum + i.amount, 0),
      error: 'ECPAY credentials not configured',
    })
  }

  // 計算 totals
  const salesAmount = opts.items.reduce((sum, i) => sum + i.amount, 0)
  const taxType = opts.taxType || '1'
  const taxAmount = taxType === '1' ? Math.round(salesAmount * 5 / 105) : 0 // 應稅 5%
  const totalAmount = salesAmount

  const payload = {
    MerchantID: merchantId,
    RelateNumber: `${opts.relatedTable || 'misc'}-${opts.relatedId || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    CustomerID: opts.customerIdentifier || '',
    CustomerIdentifier: opts.customerIdentifier || '',
    CustomerName: opts.customerName,
    CustomerAddr: opts.customerAddr || '',
    CustomerEmail: opts.customerEmail || '',
    Print: opts.customerIdentifier ? '1' : '0', // B2B 通常需要印、B2C 預設不印
    Donation: '0',
    TaxType: taxType,
    SalesAmount: totalAmount,
    InvType: '07', // 一般稅額
    Items: opts.items.map((item, idx) => ({
      ItemSeq: idx + 1,
      ItemName: item.name,
      ItemCount: item.count,
      ItemWord: item.unit,
      ItemPrice: item.price,
      ItemTaxType: taxType,
      ItemAmount: item.amount,
      ItemRemark: item.remark || '',
    })),
    CarrierType: opts.carrierType || '',
    CarrierNum: opts.carrierNum || '',
  }

  // Build encrypted request
  const encryptedData = buildEncryptedData(
    {
      PlatformID: '',
      MerchantID: merchantId,
      RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
      Data: payload,
    },
    hashKey,
    hashIv
  )

  try {
    const resp = await fetch(`${API_BASE}/Issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MerchantID: merchantId, Data: encryptedData }),
    })
    const json = await resp.json()

    if (json.TransCode !== 1) {
      return await logAndReturn({
        status: 'failed',
        relatedTable: opts.relatedTable,
        relatedId: opts.relatedId,
        customerName: opts.customerName,
        customerIdentifier: opts.customerIdentifier,
        amount: salesAmount,
        rawResponse: json,
        error: json.TransMsg || 'ECPay returned non-success TransCode',
      })
    }

    const decoded = parseEncryptedResponse(json.Data, hashKey, hashIv) as Record<string, unknown>
    const invoiceNumber = decoded?.InvoiceNumber as string | undefined
    const invoiceDate = decoded?.InvoiceDate as string | undefined

    return await logAndReturn({
      status: 'issued',
      invoiceNumber,
      invoiceDate,
      relatedTable: opts.relatedTable,
      relatedId: opts.relatedId,
      customerName: opts.customerName,
      customerIdentifier: opts.customerIdentifier,
      amount: salesAmount,
      taxAmount,
      rawResponse: decoded,
    })
  } catch (e: unknown) {
    return await logAndReturn({
      status: 'failed',
      relatedTable: opts.relatedTable,
      relatedId: opts.relatedId,
      customerName: opts.customerName,
      customerIdentifier: opts.customerIdentifier,
      amount: salesAmount,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

/**
 * 作廢發票。invoiceNumber 從 issueInvoice 的 InvoiceResult 拿。
 * 注意：依財政部規定，發票只能在開立後 30 天內或當期內作廢，過期需走折讓單。
 */
export async function invalidateInvoice(opts: {
  invoiceNumber: string
  reason: string
}): Promise<InvoiceResult> {
  const merchantId = MERCHANT_ID
  const hashKey = HASH_KEY
  const hashIv = HASH_IV
  const { invoiceNumber, reason } = opts

  if (!merchantId || !hashKey || !hashIv) {
    console.error('[invoice] credentials not set — refusing to invalidate')
    return await logAndReturn({
      status: 'skipped',
      error: 'ECPAY credentials not configured',
      customerName: '',
      amount: 0,
      invoiceNumber,
    })
  }

  const encryptedData = buildEncryptedData(
    {
      PlatformID: '',
      MerchantID: merchantId,
      RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
      Data: { MerchantID: merchantId, InvoiceNo: invoiceNumber, InvoiceDate: '', Reason: reason },
    },
    hashKey,
    hashIv
  )

  try {
    const resp = await fetch(`${API_BASE}/Invalid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ MerchantID: merchantId, Data: encryptedData }),
    })
    const json = await resp.json()
    if (json.TransCode !== 1) {
      return await logAndReturn({
        status: 'failed',
        invoiceNumber,
        customerName: '',
        amount: 0,
        rawResponse: json,
        error: json.TransMsg || 'ECPay invalidate failed',
      })
    }
    return await logAndReturn({
      status: 'issued', // invalidate 成功也記為 issued/已處理（後續查 invoices.status='invalidated'）
      invoiceNumber,
      customerName: '',
      amount: 0,
      rawResponse: json,
    })
  } catch (e: unknown) {
    return await logAndReturn({
      status: 'failed',
      invoiceNumber,
      customerName: '',
      amount: 0,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}

// ── Internal: log to invoices table ──────────────────────────────────

interface LogParams {
  status: 'issued' | 'failed' | 'skipped'
  invoiceNumber?: string
  invoiceDate?: string
  relatedTable?: string
  relatedId?: string
  customerName: string
  customerIdentifier?: string
  amount: number
  taxAmount?: number
  rawResponse?: unknown
  error?: string
}

async function logAndReturn(p: LogParams): Promise<InvoiceResult> {
  try {
    const supabase = getServiceRoleClient()
    const { data, error: insertError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: p.invoiceNumber || null,
        invoice_date: p.invoiceDate || null,
        related_table: p.relatedTable || null,
        related_id: p.relatedId || null,
        customer_name: p.customerName,
        customer_identifier: p.customerIdentifier || null,
        amount: p.amount,
        tax_amount: p.taxAmount ?? 0,
        status: p.status,
        ecpay_response: p.rawResponse ?? null,
        error_message: p.error || null,
      })
      .select('id')
      .single()

    if (insertError) {
      // invoice 已開但 DB 沒記 — 嚴重、發票存在於 ECPay 但 CRM 找不到。
      // 留 log 給人工 fail-safe（之後查 ECPay dashboard 對照）。
      console.error(
        '[invoice] DB insert failed but invoice may have been issued at ECPay. ' +
          'Manual reconciliation required.',
        { invoiceNumber: p.invoiceNumber, error: insertError.message }
      )
    }

    return {
      status: p.status,
      invoiceNumber: p.invoiceNumber,
      invoiceDate: p.invoiceDate,
      rawResponse: p.rawResponse,
      error: p.error || (insertError ? `DB log failed: ${insertError.message}` : undefined),
      logId: data?.id,
    }
  } catch (e: unknown) {
    // 包含 getServiceRoleClient 丟錯（env 未設）或網路爆掉。
    // 不丟錯、return 原本 status 但無 logId、同時 console.error。
    console.error(
      '[invoice] logAndReturn fatal — invoice may have been issued at ECPay but no DB log.',
      { invoiceNumber: p.invoiceNumber, error: e instanceof Error ? e.message : String(e) }
    )
    return {
      status: p.status,
      invoiceNumber: p.invoiceNumber,
      invoiceDate: p.invoiceDate,
      rawResponse: p.rawResponse,
      error: p.error,
    }
  }
}

// ── Export test credentials for dry-run testing ──────────────────────
// 光光真實開戶前，整合測試可用以下測試 credentials（綠界官方 sandbox）：
//   ECPAY_MERCHANT_ID=2000132
//   ECPAY_HASH_KEY=5294y06JbISpM5x9
//   ECPAY_HASH_IV=v77hoKGq4kWxNNIS
//   ECPAY_INVOICE_API_BASE=https://einvoice-stage.ecpay.com.tw/B2CInvoice
// 設進 .env.local 即可用測試環境跑開立 / 作廢、不會真的上傳財政部。
export const ECPAY_TEST_CREDENTIALS = {
  merchantId: TEST_MERCHANT_ID,
  hashKey: TEST_HASH_KEY,
  hashIv: TEST_HASH_IV,
  apiBase: 'https://einvoice-stage.ecpay.com.tw/B2CInvoice',
} as const
