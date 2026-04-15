export const dynamic = 'force-dynamic'

import { fetchFinanceSummary } from '@/lib/queries'
import { formatNTD } from '@/lib/utils'
import Link from 'next/link'
import PageHeader from '@/components/ui/PageHeader'

export default async function FinancePage() {
  const summary = await fetchFinanceSummary()

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="財務總覽"
        subtitle="本月營收、支出與補助狀態"
        moduleColor="bg-emerald-500"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="section-title mb-2">本月營收</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatNTD(summary.totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">本月支出</p>
          <p className="text-2xl font-bold text-red-500 tabular-nums">{formatNTD(summary.totalExpenses)}</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">淨收入</p>
          <p className={`text-2xl font-bold tabular-nums ${summary.netIncome >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatNTD(summary.netIncome)}
          </p>
        </div>
      </div>

      {/* Revenue + Expense breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="section-title mb-3">營收分佈</p>
          {summary.revenueByCategory.length === 0 ? (
            <p className="text-sm text-stone-300">尚無營收</p>
          ) : (
            <div className="space-y-2">
              {summary.revenueByCategory.map((r: { category: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-600">{r.category}</span>
                  <span className="font-semibold text-stone-800 tabular-nums">{formatNTD(r.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <p className="section-title mb-3">支出分佈</p>
          {summary.expenseByCategory.length === 0 ? (
            <p className="text-sm text-stone-300">尚無支出</p>
          ) : (
            <div className="space-y-2">
              {summary.expenseByCategory.map((e: { category: string; amount: number }, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-stone-600">{e.category}</span>
                  <span className="font-semibold text-stone-800 tabular-nums">{formatNTD(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subsidy summary */}
      <div className="card p-5">
        <p className="section-title mb-3">政府補助</p>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-stone-400">核准總額：</span>
            <span className="font-semibold text-stone-800">{formatNTD(summary.totalSubsidy)}</span>
          </div>
          <div>
            <span className="text-stone-400">已撥款：</span>
            <span className="font-semibold text-emerald-600">{formatNTD(summary.subsidyDisbursed)}</span>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link href="/finance/revenue" className="card px-4 py-3 text-sm text-stone-600 hover:text-amber-600 font-medium">
          營收紀錄 →
        </Link>
        <Link href="/finance/expenses" className="card px-4 py-3 text-sm text-stone-600 hover:text-amber-600 font-medium">
          費用紀錄 →
        </Link>
        <Link href="/finance/subsidies" className="card px-4 py-3 text-sm text-stone-600 hover:text-amber-600 font-medium">
          補助追蹤 →
        </Link>
      </div>
    </div>
  )
}
