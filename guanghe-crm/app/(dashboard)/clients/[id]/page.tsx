import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientInfo from '@/components/clients/ClientInfo'
import KycChecks from '@/components/clients/KycChecks'
import DocumentChecklist from '@/components/clients/DocumentChecklist'
import ContractList from '@/components/clients/ContractList'
import PaymentList from '@/components/clients/PaymentList'
import MailRecordList from '@/components/clients/MailRecordList'
import OffboardingPanel from '@/components/clients/OffboardingPanel'
import ClientTimeline from '@/components/clients/ClientTimeline'
import { fetchClient } from '@/lib/queries'
import { formatNTD } from '@/lib/utils'

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await fetchClient(id)
  if (!client) notFound()

  // Build timeline events from all client activity
  const timelineEvents = [
    {
      id: 'created',
      type: 'created' as const,
      title: '客戶建立',
      description: `來源：${client.organization.source}`,
      date: client.createdAt,
      color: '#d97706',
    },
    ...(client.kycChecks || [])
      .filter((k) => k.status !== '待查')
      .map((k) => ({
        id: `kyc-${k.id}`,
        type: 'kyc' as const,
        title: `KYC：${k.checkType}`,
        description: `狀態：${k.status}${k.overrideReason ? ` · 覆核：${k.overrideReason}` : ''}`,
        date: k.checkedAt,
        color: k.status === '通過' ? '#34d399' : k.status === '異常' ? '#f87171' : '#fbbf24',
      })),
    ...(client.contracts || []).map((c) => ({
      id: `contract-${c.id}`,
      type: 'contract' as const,
      title: `建立合約：${c.contractType}`,
      description: `${c.paymentCycle} · 月租 ${formatNTD(c.monthlyRent)} · 押金 ${formatNTD(c.depositAmount)}`,
      date: c.startDate,
      color: '#8b5cf6',
    })),
    ...(client.payments || [])
      .filter((p) => p.paidAt)
      .map((p) => ({
        id: `payment-${p.id}`,
        type: 'payment' as const,
        title: `收款：${formatNTD(p.amount)}`,
        description: `應繳日 ${p.dueDate}`,
        date: p.paidAt!,
        color: '#34d399',
      })),
    ...(client.mailRecords || []).map((m) => ({
      id: `mail-${m.id}`,
      type: 'mail' as const,
      title: `收到信件：${m.mailType}`,
      description: `${m.sender}${m.trackingNumber ? ` · ${m.trackingNumber}` : ''}`,
      date: m.receivedDate,
      color: m.mailType === '法院文書' ? '#f87171' : '#a8a29e',
    })),
    ...(client.offboardingRecords || []).map((o) => ({
      id: `offboarding-${o.id}`,
      type: 'offboarding' as const,
      title: '啟動退租流程',
      description: `合約到期 ${o.contractEndDate}${o.earlyTermination ? ' · 提前解約' : ''}`,
      date: o.requestDate,
      color: '#f59e0b',
    })),
  ]

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
        <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
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

        {/* 區塊 B2 — 文件檢核 */}
        {client.documents && client.documents.length > 0 && (
          <DocumentChecklist clientId={client.id} initialDocuments={client.documents} />
        )}

        {/* 區塊 — 合約管理 */}
        <ContractList
          clientId={client.id}
          serviceType={client.serviceType}
          monthlyFee={client.monthlyFee}
          initialContracts={client.contracts || []}
        />

        {/* 區塊 C — 收款紀錄 */}
        <PaymentList clientId={client.id} initialPayments={client.payments} />

        {/* 區塊 — 信件代收（僅借址登記）*/}
        {client.serviceType === '借址登記' && (
          <MailRecordList clientId={client.id} initialRecords={client.mailRecords || []} />
        )}

        {/* 區塊 — 退場流程（退租中或已結案階段）*/}
        {(client.stage === '退租中' || client.stage === '已結案' || (client.offboardingRecords && client.offboardingRecords.length > 0)) && (
          <OffboardingPanel
            clientId={client.id}
            serviceType={client.serviceType}
            initialRecords={client.offboardingRecords || []}
          />
        )}

        {/* 區塊 — 互動時間軸 */}
        <ClientTimeline events={timelineEvents} />
      </div>
    </div>
  )
}
