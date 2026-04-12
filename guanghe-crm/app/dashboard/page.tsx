import { formatNTD } from '@/lib/utils'
import MetricCard from '@/components/dashboard/MetricCard'
import OverdueTable from '@/components/dashboard/OverdueTable'
import { fetchDashboard } from '@/lib/queries'

export default async function DashboardPage() {
  const data = await fetchDashboard()

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">儀表板</h1>
        <p className="text-xs text-gray-400 mt-0.5">本月營收總覽與逾期追蹤</p>
      </div>

      {/* 數字卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="服務中客戶"
          value={`${data.activeCount} 家`}
        />
        <MetricCard
          title="本月應收"
          value={formatNTD(data.monthlyDue)}
        />
        <MetricCard
          title="本月實收"
          value={formatNTD(data.monthlyCollected)}
          sub={data.gap > 0 ? `缺口 ${formatNTD(data.gap)}` : '全數收齊'}
          subColor={data.gap > 0 ? 'red' : 'gray'}
        />
      </div>

      {/* 逾期清單 */}
      <OverdueTable items={data.overdueList} />
    </div>
  )
}
