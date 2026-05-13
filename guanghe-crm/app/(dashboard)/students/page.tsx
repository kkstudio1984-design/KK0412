export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { fetchStudents } from '@/lib/queries'
import { formatNTD } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'

const STATUS_COLORS: Record<string, string> = {
  '培訓中': 'bg-amber-100 text-amber-700 border-amber-200',
  '實習中': 'bg-blue-100 text-blue-700 border-blue-200',
  '執業中': 'bg-green-100 text-green-700 border-green-200',
  '暫停中': 'bg-gray-100 text-gray-700 border-gray-200',
  '離開': 'bg-stone-100 text-stone-500 border-stone-200',
}

const STABILITY_COLORS: Record<string, string> = {
  '穩定': 'text-green-700',
  '普通': 'text-amber-700',
  '需要關照': 'text-red-700',
}

export default async function StudentsPage() {
  const students = await fetchStudents()

  const inTraining = students.filter(s => s.status === '培訓中').length
  const inPractice = students.filter(s => s.status === '實習中').length
  const working = students.filter(s => s.status === '執業中').length
  const totalActive = inTraining + inPractice + working
  const totalMonthlyIncome = students
    .filter(s => s.status === '執業中')
    .reduce((sum, s) => sum + s.incomeMonthlyEstimated, 0)

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="學員管理"
        subtitle="身障者 AI 就業 skill 計畫"
        action={
          <Link
            href="/students/new"
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            + 新增學員
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">活躍學員</p>
          <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">培訓中</p>
          <p className="text-2xl font-bold text-amber-600">{inTraining}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">執業中</p>
          <p className="text-2xl font-bold text-green-600">{working}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">執業學員月收合計</p>
          <p className="text-2xl font-bold text-gray-900">{formatNTD(totalMonthlyIncome)}</p>
        </div>
      </div>

      {/* Empty state */}
      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500 mb-2">尚未登錄任何學員</p>
          <p className="text-xs text-gray-400 mb-4">第一位學員可從右上角「+ 新增學員」開始</p>
          <Link
            href="/students/new"
            className="inline-block bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 text-sm font-semibold px-5 py-2 rounded-lg shadow-sm"
          >
            + 新增第一位學員
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-widest text-left">
                <th className="px-4 py-3">代碼</th>
                <th className="px-4 py-3">稱呼</th>
                <th className="px-4 py-3">期別</th>
                <th className="px-4 py-3">狀態</th>
                <th className="px-4 py-3">進度</th>
                <th className="px-4 py-3">心理</th>
                <th className="px-4 py-3">公開授權</th>
                <th className="px-4 py-3 text-right">月收</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.code}</td>
                  <td className="px-4 py-3 text-gray-900">{s.displayName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.cohort || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">W{s.trainingProgressStep}/12</td>
                  <td className={`px-4 py-3 text-xs font-medium ${STABILITY_COLORS[s.mentalStability || ''] || 'text-gray-500'}`}>
                    {s.mentalStability || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {s.publicConsent ? <span className="text-green-700">✓ 已同意</span> : <span className="text-gray-400">— 未同意</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {s.status === '執業中' ? formatNTD(s.incomeMonthlyEstimated) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 隱私提醒 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
        <p className="font-semibold mb-1">隱私守則</p>
        <p>學員資料屬高敏感個資。任何對外引用（IG／FB／Podcast／ESG 報告書）前，**必須**確認該位學員的「公開授權」與「工作成果授權」都已簽署。預設 false。</p>
      </div>
    </div>
  )
}
