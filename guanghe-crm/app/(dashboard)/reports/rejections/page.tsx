export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { format, startOfMonth, subMonths } from 'date-fns'
import PageHeader from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import CopyAllButton from '@/components/reports/CopyAllButton'

interface RejectionRow {
  contractId: string
  contractType: string | null
  signedAt: string | null
  rejectReason: string | null
  signerName: string | null
  clientId: string | null
  clientName: string
}

const KEYWORD_BUCKETS: Array<{ label: string; keywords: string[] }> = [
  { label: '價格 / 費用', keywords: ['貴', '便宜', '價格', '費用', '預算', '成本', '太高'] },
  { label: '條款 / 合約', keywords: ['條款', '合約', '規定', '法律', '違約', '責任'] },
  { label: '時間 / 期限', keywords: ['時間', '期限', '太久', '太短', '當下', '現在', '考慮'] },
  { label: '需求變動', keywords: ['不需要', '已找到', '其他', '取消', '計畫'] },
  { label: '溝通 / 服務', keywords: ['服務', '回覆', '專業', '聯繫', '態度'] },
]

function categorize(reason: string | null): string[] {
  if (!reason) return ['未分類']
  const hits: string[] = []
  for (const bucket of KEYWORD_BUCKETS) {
    if (bucket.keywords.some(kw => reason.includes(kw))) {
      hits.push(bucket.label)
    }
  }
  return hits.length > 0 ? hits : ['未分類']
}

export default async function RejectionsReportPage() {
  const supabase = await createClient()
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const sixMonthsAgo = format(startOfMonth(subMonths(new Date(), 6)), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      id, contract_type, signed_at, reject_reason, signer_name,
      space_client:space_clients(
        id,
        organization:organizations(name)
      )
    `)
    .eq('signing_status', '已拒絕')
    .gte('signed_at', sixMonthsAgo)
    .order('signed_at', { ascending: false })

  const rows: RejectionRow[] = ((data || []) as any[]).map(r => ({
    contractId: r.id,
    contractType: r.contract_type,
    signedAt: r.signed_at,
    rejectReason: r.reject_reason,
    signerName: r.signer_name,
    clientId: r.space_client?.id || null,
    clientName: r.space_client?.organization?.name || '未知客戶',
  }))

  const total = rows.length
  const thisMonth = rows.filter(r => r.signedAt && r.signedAt >= monthStart).length
  const withReason = rows.filter(r => r.rejectReason && r.rejectReason.trim()).length

  // 主題分類統計
  const bucketCounts = new Map<string, number>()
  for (const r of rows) {
    for (const tag of categorize(r.rejectReason)) {
      bucketCounts.set(tag, (bucketCounts.get(tag) || 0) + 1)
    }
  }
  const sortedBuckets = Array.from(bucketCounts.entries())
    .sort((a, b) => b[1] - a[1])

  // 全部複製用的純文字
  const copyText = rows
    .filter(r => r.rejectReason && r.rejectReason.trim())
    .map(r => `${r.signedAt?.slice(0, 10) || '—'} · ${r.clientName}（${r.contractType || '合約'}）\n${r.rejectReason}\n`)
    .join('\n')

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="拒絕原因復盤"
        subtitle="近 6 個月被客戶拒簽的合約 + 原因，每月底掃一次找模式"
        moduleColor="bg-red-500"
        action={<CopyAllButton text={copyText} disabled={rows.length === 0} />}
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          載入失敗：{error.message}
        </div>
      )}

      {/* 摘要三格 */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">近 6 個月拒簽總數</p>
          <p className="text-2xl font-bold text-gray-900">{total} <span className="text-base font-normal text-gray-400">份</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">本月拒簽</p>
          <p className="text-2xl font-bold text-red-600">{thisMonth} <span className="text-base font-normal text-gray-400">份</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">有填寫原因</p>
          <p className="text-2xl font-bold text-gray-900">{withReason} <span className="text-base font-normal text-gray-400">/ {total}</span></p>
        </div>
      </section>

      {/* 主題分類 */}
      {sortedBuckets.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">原因主題分類（粗略關鍵字比對）</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {sortedBuckets.map(([label, count]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-100 text-sm text-stone-700"
                >
                  <span>{label}</span>
                  <span className="font-bold tabular-nums text-amber-600">{count}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">關鍵字命中是粗略統計，僅供找方向用 — 實際語意需要人眼掃過原文。</p>
          </div>
        </section>
      )}

      {/* 拒簽明細列表 */}
      <section>
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-3">拒簽明細（按時間倒序）</h2>
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            近 6 個月還沒有任何客戶拒簽紀錄。<br />
            （若拒簽剛開始累積，可能要再等幾週才有資料）
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <article
                key={r.contractId}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-red-200 transition"
              >
                <header className="flex items-center justify-between mb-2 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-red-500 text-lg">🚫</span>
                    {r.clientId ? (
                      <Link
                        href={`/clients/${r.clientId}`}
                        className="font-semibold text-gray-900 hover:text-amber-700 truncate"
                      >
                        {r.clientName}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900 truncate">{r.clientName}</span>
                    )}
                    <span className="text-xs text-gray-400 shrink-0">{r.contractType || '合約'}</span>
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums shrink-0">
                    {r.signedAt ? format(new Date(r.signedAt), 'yyyy/MM/dd HH:mm') : '—'}
                  </span>
                </header>
                {r.signerName && (
                  <p className="text-xs text-gray-400 mb-2">簽署人：{r.signerName}</p>
                )}
                {r.rejectReason ? (
                  <div className="bg-red-50 border-l-3 border-red-300 px-4 py-3 rounded text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {r.rejectReason}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">客戶未填寫原因，建議主動聯繫了解。</p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {categorize(r.rejectReason).map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 復盤指引 */}
      <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h2 className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3">每月復盤步驟</h2>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
          <li>看本月主題分類，找出最大宗的拒絕原因（例：「價格／費用」占一半 → 銷售話術或定價要調整）</li>
          <li>掃明細逐條，把意思相近的合併成 3–5 個共通模式</li>
          <li>用「全部複製」按鈕把原因匯出，丟到 ChatGPT 或 Claude 做語意聚類，找出隱藏訊號</li>
          <li>把找到的共通模式寫進銷售話術 / 合約條款 / FAQ</li>
          <li>下個月看新進拒簽數是否下降，驗證調整是否有效</li>
        </ol>
      </section>
    </div>
  )
}
