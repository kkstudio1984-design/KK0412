'use client'

import { downloadCSV } from '@/lib/csv'
import { formatNTD } from '@/lib/utils'
import nextDynamic from 'next/dynamic'

const TrendChart = nextDynamic(() => import('@/components/dashboard/TrendChart'), { ssr: false })

interface Trend {
  month: string
  revenue: number
  expense: number
  newClients: number
  activeClients: number
}

interface Props {
  trends: Trend[]
}

export default function MonthlyReport({ trends }: Props) {
  const handleExport = () => {
    const headers = ['月份', '營收', '支出', '淨收入', '新客戶', '服務中客戶']
    const rows = trends.map((t) => [
      t.month,
      String(t.revenue),
      String(t.expense),
      String(t.revenue - t.expense),
      String(t.newClients),
      String(t.activeClients),
    ])
    downloadCSV(`月報表_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  const totalRevenue = trends.reduce((s, t) => s + t.revenue, 0)
  const totalExpense = trends.reduce((s, t) => s + t.expense, 0)
  const netIncome = totalRevenue - totalExpense
  const avgMonthlyRevenue = Math.round(totalRevenue / trends.length)
  const latestActive = trends[trends.length - 1]?.activeClients || 0

  const revenueData = trends.map((t) => ({ month: t.month, value: t.revenue }))
  const expenseData = trends.map((t) => ({ month: t.month, value: t.expense }))
  const activeClientData = trends.map((t) => ({ month: t.month, value: t.activeClients }))
  const newClientData = trends.map((t) => ({ month: t.month, value: t.newClients }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-6 text-sm">
          <div>
            <p className="section-title mb-1">6 個月營收</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#34d399' }}>{formatNTD(totalRevenue)}</p>
          </div>
          <div>
            <p className="section-title mb-1">6 個月支出</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#f87171' }}>{formatNTD(totalExpense)}</p>
          </div>
          <div>
            <p className="section-title mb-1">淨收入</p>
            <p className={`text-xl font-bold tabular-nums`} style={{ color: netIncome >= 0 ? '#34d399' : '#f87171' }}>
              {formatNTD(netIncome)}
            </p>
          </div>
          <div>
            <p className="section-title mb-1">月均營收</p>
            <p className="text-xl font-bold text-white tabular-nums">{formatNTD(avgMonthlyRevenue)}</p>
          </div>
          <div>
            <p className="section-title mb-1">目前服務中</p>
            <p className="text-xl font-bold text-white tabular-nums">{latestActive} 家</p>
          </div>
        </div>
        <button onClick={handleExport} className="btn-secondary">匯出 CSV</button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendChart title="月營收趨勢" data={revenueData} color="#34d399" format="currency" />
        <TrendChart title="月支出趨勢" data={expenseData} color="#f87171" format="currency" />
        <TrendChart title="服務中客戶數" data={activeClientData} color="#0ea5e9" format="number" />
        <TrendChart title="每月新客戶" data={newClientData} color="#d97706" format="number" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold px-4 py-3">月份</th>
              <th className="text-right text-xs font-semibold px-4 py-3">營收</th>
              <th className="text-right text-xs font-semibold px-4 py-3">支出</th>
              <th className="text-right text-xs font-semibold px-4 py-3">淨收入</th>
              <th className="text-right text-xs font-semibold px-4 py-3">新客戶</th>
              <th className="text-right text-xs font-semibold px-4 py-3">服務中</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {trends.map((t, i) => {
              const net = t.revenue - t.expense
              return (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-white">{t.month}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: '#34d399' }}>{formatNTD(t.revenue)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: '#f87171' }}>{formatNTD(t.expense)}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: net >= 0 ? '#34d399' : '#f87171' }}>{formatNTD(net)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.newClients}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.activeClients}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
