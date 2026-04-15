export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PrintButton from '@/components/print/PrintButton'

export default async function PrintSubsidyReconciliationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: subsidy } = await supabase.from('subsidy_tracking').select('*').eq('id', id).single()
  if (!subsidy) notFound()

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('*, partner:partners(name, disability_type, disability_level)')
    .eq('subsidy_id', id)
    .order('attendance_date', { ascending: true })

  const att = attendance || []
  const s = subsidy as {
    subsidy_name: string
    agency: string
    annual_amount: number
  }

  const byPartner: Record<
    string,
    { name: string; disability: string | null; level: string | null; hours: number; days: Set<string> }
  > = {}
  let totalHours = 0

  for (const a of att as Array<{
    partner_id: string
    attendance_date: string
    hours_worked: number | null
    partner?: { name: string; disability_type: string | null; disability_level: string | null } | null
  }>) {
    const pid = a.partner_id
    const h = a.hours_worked || 0
    if (!byPartner[pid]) {
      byPartner[pid] = {
        name: a.partner?.name || '—',
        disability: a.partner?.disability_type || null,
        level: a.partner?.disability_level || null,
        hours: 0,
        days: new Set(),
      }
    }
    byPartner[pid].hours += h
    byPartner[pid].days.add(a.attendance_date)
    totalHours += h
  }

  const partnerRows = Object.values(byPartner).sort((a, b) => b.hours - a.hours)

  const dates = att
    .map((a) => (a as { attendance_date: string }).attendance_date)
    .sort()
  const firstDate = dates[0] || null
  const lastDate = dates[dates.length - 1] || null

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Toolbar (no-print) */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <PrintButton />
        <a
          href={`/finance/subsidies/${id}`}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-200 text-stone-700 hover:bg-stone-300"
        >
          返回
        </a>
      </div>

      <style>{`
        @media print {
          @page { margin: 2cm; size: A4; }
          body { font-family: 'Noto Sans TC', 'PingFang TC', sans-serif; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-10 py-16 font-sans">
        {/* Header */}
        <div className="border-b-2 border-stone-900 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
              光
            </div>
            <div>
              <p className="text-xs text-stone-500">光合創學 | Guanghe</p>
              <p className="text-sm font-bold text-stone-900">補助核銷報表</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{s.subsidy_name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-stone-600 mt-2">
            <span>主管機關：{s.agency}</span>
            <span>年度金額：NT$ {s.annual_amount.toLocaleString('zh-TW')}</span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            報表產出日：{format(new Date(), 'yyyy/MM/dd')}
            {firstDate && ` · 核銷期間：${firstDate} ～ ${lastDate}`}
          </p>
        </div>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-stone-900 mb-3 border-l-4 border-emerald-500 pl-2">
            核銷總覽
          </h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border border-stone-300 rounded p-3">
              <p className="text-xs text-stone-500">參與夥伴</p>
              <p className="text-xl font-bold text-stone-900 tabular-nums">{partnerRows.length} 人</p>
            </div>
            <div className="border border-stone-300 rounded p-3">
              <p className="text-xs text-stone-500">總出勤天數</p>
              <p className="text-xl font-bold text-stone-900 tabular-nums">{att.length} 筆</p>
            </div>
            <div className="border border-stone-300 rounded p-3">
              <p className="text-xs text-stone-500">總服務時數</p>
              <p className="text-xl font-bold text-stone-900 tabular-nums">{totalHours.toFixed(2)} h</p>
            </div>
          </div>
        </section>

        {/* Partner breakdown */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-stone-900 mb-3 border-l-4 border-emerald-500 pl-2">
            夥伴服務明細
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-900">
                <th className="text-left py-2 px-2 text-xs text-stone-600">#</th>
                <th className="text-left py-2 px-2 text-xs text-stone-600">夥伴姓名</th>
                <th className="text-left py-2 px-2 text-xs text-stone-600">障礙類別</th>
                <th className="text-left py-2 px-2 text-xs text-stone-600">等級</th>
                <th className="text-right py-2 px-2 text-xs text-stone-600">出勤天數</th>
                <th className="text-right py-2 px-2 text-xs text-stone-600">服務時數</th>
              </tr>
            </thead>
            <tbody>
              {partnerRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-stone-400">
                    尚無核銷記錄
                  </td>
                </tr>
              ) : (
                partnerRows.map((p, i) => (
                  <tr key={i} className="border-b border-stone-200">
                    <td className="py-2 px-2 text-stone-700 tabular-nums">{i + 1}</td>
                    <td className="py-2 px-2 text-stone-900 font-medium">{p.name}</td>
                    <td className="py-2 px-2 text-stone-700">{p.disability || '—'}</td>
                    <td className="py-2 px-2 text-stone-700">{p.level || '—'}</td>
                    <td className="py-2 px-2 text-right text-stone-700 tabular-nums">{p.days} 天</td>
                    <td className="py-2 px-2 text-right text-stone-900 font-semibold tabular-nums">
                      {p.hours.toFixed(2)} h
                    </td>
                  </tr>
                ))
              )}
              {partnerRows.length > 0 && (
                <tr className="border-t-2 border-stone-900">
                  <td colSpan={4} className="py-2 px-2 text-right font-bold text-stone-900">
                    合計
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-stone-900 tabular-nums">
                    {att.length} 筆
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-stone-900 tabular-nums">
                    {totalHours.toFixed(2)} h
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {/* Signatures */}
        <section className="mt-16 grid grid-cols-2 gap-12">
          <div>
            <div className="border-t border-stone-400 pt-2">
              <p className="text-xs text-stone-500">核銷人簽章</p>
              <p className="text-xs text-stone-500 mt-6">日期：________________</p>
            </div>
          </div>
          <div>
            <div className="border-t border-stone-400 pt-2">
              <p className="text-xs text-stone-500">主管簽章</p>
              <p className="text-xs text-stone-500 mt-6">日期：________________</p>
            </div>
          </div>
        </section>

        <p className="mt-12 text-xs text-stone-400 text-center">
          光合創學有限公司 · 身心障礙者就業服務機構
        </p>
      </div>
    </div>
  )
}
