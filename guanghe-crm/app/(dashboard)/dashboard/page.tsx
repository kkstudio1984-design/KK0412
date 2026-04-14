export const dynamic = 'force-dynamic'

import { formatNTD } from '@/lib/utils'
import { fetchDashboard } from '@/lib/queries'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'
import RevenueChart from '@/components/dashboard/RevenueChart'
import PipelineChart from '@/components/dashboard/PipelineChart'

const ESCALATION_COLORS: Record<string, string> = {
  '正常': 'text-gray-500',
  '提醒': 'text-yellow-600',
  '催告': 'text-orange-600',
  '存證信函': 'text-red-600',
  '退租啟動': 'text-red-800 font-bold',
}

export default async function DashboardPage() {
  const data = await fetchDashboard()
  const fireCount = data.urgentMail.length + data.kycOverdue.length + data.followUpToday.length + data.overduePayments.length + data.kycRenewalDue.length + data.contractExpiringSoon.length

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="營運儀表板"
        subtitle="三層營運總覽"
      />

      {/* Tier 1: 救火層 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-red-600 uppercase tracking-widest">救火層</h2>
          <span className="text-xs text-gray-400">今天會不會爆？</span>
          {fireCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">{fireCount} 項待處理</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 緊急信件 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">緊急信件</h3>
            {data.urgentMail.length === 0 ? (
              <p className="text-sm text-gray-300">無</p>
            ) : (
              <div className="space-y-2">
                {data.urgentMail.map((m, i) => (
                  <div key={i} className={`text-sm flex justify-between ${m.mailType === '法院文書' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    <span>{m.clientName} — {m.mailType}</span>
                    <span className="text-xs text-gray-400">{m.daysPending} 天</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KYC 超時 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">KYC 超時未完成</h3>
            {data.kycOverdue.length === 0 ? (
              <p className="text-sm text-gray-300">無</p>
            ) : (
              <div className="space-y-2">
                {data.kycOverdue.map((k, i) => (
                  <div key={i} className="text-sm text-gray-700 flex justify-between">
                    <span>{k.clientName}</span>
                    <span className="text-xs text-yellow-600">{k.daysSinceUpdate} 天未更新</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 今天跟進 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">今天該跟進</h3>
            {data.followUpToday.length === 0 ? (
              <p className="text-sm text-gray-300">無</p>
            ) : (
              <div className="space-y-2">
                {data.followUpToday.map((f, i) => (
                  <Link key={i} href={`/clients/${f.clientId}`} className="text-sm text-gray-700 flex justify-between hover:text-amber-600">
                    <span>{f.clientName}</span>
                    <span className="text-xs text-gray-400 truncate ml-2">{f.nextAction || '—'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 逾期收款 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">逾期收款</h3>
            {data.overduePayments.length === 0 ? (
              <p className="text-sm text-gray-300">無</p>
            ) : (
              <div className="space-y-2">
                {data.overduePayments.map((p, i) => (
                  <div key={i} className="text-sm flex justify-between items-center">
                    <span className="text-gray-700">{p.orgName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{formatNTD(p.amount)}</span>
                      <span className={`text-xs ${ESCALATION_COLORS[p.escalationLevel] || 'text-gray-500'}`}>{p.escalationLevel}</span>
                      <span className="text-xs text-stone-400">
                        {p.overdueDays >= 60 ? '→ 退租啟動' : p.overdueDays >= 30 ? '→ 存證信函' : p.overdueDays >= 14 ? '→ 催告' : p.overdueDays >= 7 ? '→ 提醒' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 合約即將到期 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">合約即將到期</h3>
            {data.contractExpiringSoon.length === 0 ? (
              <p className="text-sm text-gray-300">無</p>
            ) : (
              <div className="space-y-2">
                {data.contractExpiringSoon.map((c, i) => (
                  <div key={i} className="text-sm flex justify-between">
                    <span className="text-gray-700">{c.clientName} — {c.contractType}</span>
                    <span className={`text-xs ${c.daysLeft <= 7 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>{c.daysLeft} 天</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KYC 覆核到期 */}
        {data.kycRenewalDue.length > 0 && (
          <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">年度 KYC 覆核到期</h3>
            <div className="space-y-2">
              {data.kycRenewalDue.map((k, i) => (
                <div key={i} className="text-sm text-gray-700 flex justify-between">
                  <span>{k.clientName}</span>
                  <span className="text-xs text-orange-600">已超過 {k.daysSince} 天</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Tier 2: 生存層 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-amber-600 uppercase tracking-widest">生存層</h2>
          <span className="text-xs text-gray-400">錢夠不夠活？</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">本月應收</p>
            <p className="text-2xl font-bold text-gray-900">{formatNTD(data.monthlyDue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">本月實收</p>
            <p className="text-2xl font-bold text-green-600">{formatNTD(data.monthlyCollected)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">缺口</p>
            <p className={`text-2xl font-bold ${data.gap > 0 ? 'text-red-500' : 'text-green-600'}`}>{data.gap > 0 ? formatNTD(data.gap) : '已收齊'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Revenue by type */}
          <RevenueChart data={data.revenueByType} />

          {/* Cash flow */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">未來 90 天應收</p>
            <p className="text-2xl font-bold text-gray-900">{formatNTD(data.cashFlow90Days)}</p>
          </div>

          {/* Deposits held */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">持有押金</p>
            <p className="text-2xl font-bold text-gray-900">{formatNTD(data.totalDepositsHeld)}</p>
            <p className="text-xs text-gray-400 mt-1">這是要退的錢</p>
          </div>
        </div>

        {/* Target lines */}
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              <span className="text-gray-600">損益平衡線</span>
              <span className="font-medium">{formatNTD(150000)}/月</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              <span className="text-gray-600">年度目標線</span>
              <span className="font-medium">{formatNTD(375000)}/月</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="text-gray-600">本月實收</span>
              <span className={`font-bold ${data.monthlyCollected >= 375000 ? 'text-green-600' : data.monthlyCollected >= 150000 ? 'text-amber-600' : 'text-red-600'}`}>
                {formatNTD(data.monthlyCollected)}
              </span>
            </div>
          </div>
          {/* Simple bar */}
          <div className="mt-3 h-4 bg-gray-100 rounded-full relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (data.monthlyCollected / 375000) * 100)}%` }} />
            <div className="absolute top-0 bottom-0 w-px bg-red-400" style={{ left: `${(150000 / 375000) * 100}%` }} />
          </div>
        </div>
      </section>

      {/* Tier 3: 成長層 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-green-600 uppercase tracking-widest">成長層</h2>
          <span className="text-xs text-gray-400">三個月後客戶在哪？</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Pipeline */}
          <PipelineChart data={data.pipelineCounts} />

          {/* Conversion + Cycle */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">本月轉化率</p>
            <p className="text-2xl font-bold text-gray-900">{data.conversionRate.rate}%</p>
            <p className="text-xs text-gray-400 mt-1">{data.conversionRate.signed} 簽約 / {data.conversionRate.inquiries} 詢問</p>
          </div>

          {/* Seat utilization */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">座位使用率</p>
            <p className="text-2xl font-bold text-gray-900">{data.seatUtilization.rate}%</p>
            <p className="text-xs text-gray-400 mt-1">{data.seatUtilization.sold} / {data.seatUtilization.total} 座</p>
          </div>

          {/* Source analysis */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm col-span-2 md:col-span-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">客戶來源分佈</p>
            {data.sourceAnalysis.length === 0 ? (
              <p className="text-sm text-gray-300">尚無資料</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {data.sourceAnalysis.map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
                    <span className="text-sm text-gray-700">{s.source}</span>
                    <span className="text-xs font-bold text-amber-600">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
