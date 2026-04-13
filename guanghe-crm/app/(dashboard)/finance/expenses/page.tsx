export const dynamic = 'force-dynamic'

import { fetchExpenses } from '@/lib/queries'
import ExpenseList from '@/components/finance/ExpenseList'

export default async function ExpensesPage() {
  const expenses = await fetchExpenses()
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/finance" className="text-stone-400 hover:text-stone-600 text-sm">← 財務總覽</a>
        <span className="text-stone-300">/</span>
        <h1 className="text-lg font-bold text-stone-800">費用紀錄</h1>
      </div>
      <ExpenseList initialExpenses={expenses} />
    </div>
  )
}
