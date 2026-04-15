'use client'

import { formatNTD } from '@/lib/utils'
import { downloadCSV } from '@/lib/csv'

interface Row {
  id: string
  date: string
  orgName: string
  taxId: string
  serviceType: string
  amount: number
}

interface Props {
  rows: Row[]
  period: string
  periodLabel: string
}

export default function TaxReport({ rows, period, periodLabel }: Props) {
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const taxable = Math.round(total / 1.05)
  const tax = total - taxable

  const now = new Date()
  const currentYear = now.getFullYear()

  const handleExport = () => {
    const headers = ['日期', '公司名稱', '統一編號', '服務類型', '含稅金額', '未稅金額', '營業稅']
    const rowsCsv = rows.map(r => [
      r.date,
      r.orgName,
      r.taxId,
      r.serviceType,
      String(r.amount),
      String(Math.round(r.amount / 1.05)),
      String(r.amount - Math.round(r.amount / 1.05)),
    ])
    rowsCsv.push(['', '', '', '合計', String(total), String(taxable), String(tax)])
    downloadCSV(`稅務報表_${period}.csv`, headers, rowsCsv)
  }

  const periods: { value: string; label: string }[] = []
  for (const year of [currentYear, currentYear - 1]) {
    for (let p = 6; p >= 1; p--) {
      const startMonth = (p - 1) * 2 + 1
      periods.push({ value: `${year}-${p}`, label: `${year} 年 ${startMonth}-${startMonth + 1} 月` })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#888' }}>期間：</span>
          <select
            defaultValue={period}
            onChange={e => window.location.href = `/reports/tax?period=${e.target.value}`}
            className="input-base max-w-[200px]"
          >
            {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <button onClick={handleExport} className="btn-secondary">匯出稅務 CSV</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="section-title mb-2">含稅總額</p>
          <p className="text-2xl font-bold text-white tabular-nums">{formatNTD(total)}</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>共 {rows.length} 筆</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">銷售額（未稅）</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#34d399' }}>{formatNTD(taxable)}</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>申報稅基</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">應納營業稅</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#fbbf24' }}>{formatNTD(tax)}</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>5% (估算)</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold px-4 py-3">日期</th>
              <th className="text-left text-xs font-semibold px-4 py-3">公司</th>
              <th className="text-left text-xs font-semibold px-4 py-3">統編</th>
              <th className="text-left text-xs font-semibold px-4 py-3">類型</th>
              <th className="text-right text-xs font-semibold px-4 py-3">含稅金額</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(r => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-xs" style={{ color: '#c8c4be' }}>{r.date.slice(0, 10)}</td>
                <td className="px-4 py-3">{r.orgName}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: '#9a9a9a' }}>{r.taxId}</td>
                <td className="px-4 py-3"><span className="badge badge-amber">{r.serviceType}</span></td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{formatNTD(r.amount)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: '#0a0a0a', borderTop: '2px solid #333' }}>
                <td colSpan={4} className="px-4 py-3 font-bold text-white">合計</td>
                <td className="px-4 py-3 text-right font-bold text-lg tabular-nums text-white">{formatNTD(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
        {rows.length === 0 && <p className="text-sm text-center py-8" style={{ color: '#666' }}>此期間無已收款紀錄</p>}
      </div>

      <p className="text-xs mt-4" style={{ color: '#666' }}>
        注意：此報表僅供參考。正式申報請會同會計師核對，並以您實際開立的電子發票資料為準。
      </p>
    </div>
  )
}
