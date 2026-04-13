import Link from 'next/link'
import LeadForm from '@/components/leads/LeadForm'

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/sales"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 銷售管線
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">新增潛在客戶</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <LeadForm />
      </div>
    </div>
  )
}
