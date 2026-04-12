import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientInfo from '@/components/clients/ClientInfo'
import KycChecks from '@/components/clients/KycChecks'
import PaymentList from '@/components/clients/PaymentList'
import { fetchClient } from '@/lib/queries'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await fetchClient(id)
  if (!client) notFound()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 看板
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900 truncate">
          {client.organization.name}
        </h1>
        <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {client.stage}
        </span>
      </div>

      <div className="space-y-4">
        {/* 區塊 A — 基本資料 */}
        <ClientInfo client={client} />

        {/* 區塊 B — KYC（僅借址登記） */}
        {client.serviceType === '借址登記' && (
          <KycChecks clientId={client.id} initialChecks={client.kycChecks} />
        )}

        {/* 區塊 C — 收款紀錄 */}
        <PaymentList clientId={client.id} initialPayments={client.payments} />
      </div>
    </div>
  )
}
