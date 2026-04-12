import { OverdueItem } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'

interface Props {
  items: OverdueItem[]
}

export default function OverdueTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">逾期未收清單</h2>
        <p className="text-sm text-gray-400 text-center py-6">目前無逾期收款</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h2 className="font-semibold text-gray-800 mb-4">
        逾期未收清單
        <span className="ml-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
          {items.length} 筆
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 pb-2.5 tracking-wide">公司名稱</th>
              <th className="text-left text-xs font-semibold text-gray-400 pb-2.5 tracking-wide">應繳日期</th>
              <th className="text-right text-xs font-semibold text-gray-400 pb-2.5 tracking-wide">金額</th>
              <th className="text-right text-xs font-semibold text-gray-400 pb-2.5 tracking-wide">逾期天數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.paymentId} className="hover:bg-stone-50 transition-colors">
                <td className="py-3 font-medium text-gray-800">{item.orgName}</td>
                <td className="py-3 text-gray-500">{formatDate(item.dueDate)}</td>
                <td className="py-3 text-right font-medium text-gray-800">{formatNTD(item.amount)}</td>
                <td className="py-3 text-right">
                  <span className="text-red-600 font-bold">{item.overdueDays} 天</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
