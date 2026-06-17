// ── Customer Self-Service Portal ──────────────────────────────
// P2-1：客戶用 magic link 進來、自己看合約 / 繳款 / KYC / 月報預告，
// 省光光跟 Miu 50% 客服時間。
//
// 路由：/portal/[token]
// 安全模型：token 43 chars URL-safe random、30 天 TTL、不需 auth。
// 設 noindex 避免 Google 抓到。

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { validatePortalToken, fetchPortalData, type PortalData } from '@/lib/portal-token'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata: Metadata = {
  title: '客戶自助查詢 | 光合創學',
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPage({ params }: PageProps) {
  const { token } = await params

  const validated = await validatePortalToken(token)
  if (!validated) {
    notFound()
  }

  const data = await fetchPortalData(validated.spaceClientId)
  if (!data) {
    notFound()
  }

  const expiresIn = Math.ceil(
    (new Date(validated.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  )

  return (
    <div className="min-h-screen bg-emerald-50">
      <Header data={data} expiresIn={expiresIn} />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <ContractWidget contract={data.contract} />
        <PaymentsWidget payments={data.payments} />
        <KycWidget kyc={data.kyc} />
        <MonthlyReportWidget monthlyReport={data.monthlyReport} />
        <FooterNote contactName={data.client.contactName} />
      </main>
    </div>
  )
}

// ── Components ────────────────────────────────────────────────

function Header({ data, expiresIn }: { data: PortalData; expiresIn: number }) {
  return (
    <header className="bg-emerald-900 text-emerald-50 px-4 py-6 shadow-md">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-emerald-200 mb-1">光合創學股份有限公司｜客戶自助查詢</p>
        <h1 className="text-2xl font-serif font-bold tracking-wide">{data.client.orgName}</h1>
        <p className="text-sm text-emerald-200 mt-2">
          聯絡人 {data.client.contactName}　·　服務類型 {data.client.serviceType}　·　目前狀態
          {data.client.stage}
        </p>
        <p className="text-xs text-emerald-300 mt-3">
          此查詢連結將於 {expiresIn} 天後失效、過期請聯絡光合創學重新發送
        </p>
      </div>
    </header>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-emerald-100 overflow-hidden">
      <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100">
        <h2 className="font-serif text-lg text-emerald-900 tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  )
}

function ContractWidget({ contract }: { contract: PortalData['contract'] }) {
  if (!contract) {
    return (
      <Card title="合約狀態">
        <p className="text-stone-500 text-sm">目前尚無合約紀錄、若您已簽約但未顯示請聯絡光合創學。</p>
      </Card>
    )
  }

  return (
    <Card title="合約狀態">
      <dl className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
        <Row label="合約類型" value={contract.type} />
        <Row label="繳費週期" value={contract.paymentCycle} />
        <Row label="生效日期" value={formatDate(contract.startDate)} />
        <Row label="到期日期" value={formatDate(contract.endDate)} />
        <Row label="月租金額" value={`NT$ ${contract.monthlyRent.toLocaleString()}`} />
        <Row label="押金狀態" value={contract.depositStatus} />
        <Row
          label="公證狀態"
          value={contract.isNotarized ? '已公證' : '未公證'}
          highlight={contract.isNotarized ? 'good' : undefined}
        />
      </dl>
    </Card>
  )
}

function PaymentsWidget({ payments }: { payments: PortalData['payments'] }) {
  if (payments.length === 0) {
    return (
      <Card title="繳款紀錄">
        <p className="text-stone-500 text-sm">尚無繳款紀錄。</p>
      </Card>
    )
  }

  return (
    <Card title="繳款紀錄（近 12 期）">
      <table className="w-full text-sm">
        <thead className="text-stone-500 text-left">
          <tr className="border-b border-emerald-100">
            <th className="py-2 font-medium">到期日</th>
            <th className="py-2 font-medium">金額</th>
            <th className="py-2 font-medium">狀態</th>
            <th className="py-2 font-medium">實際繳款日</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p, i) => (
            <tr key={i} className="border-b border-stone-50 last:border-0">
              <td className="py-2">{formatDate(p.dueDate)}</td>
              <td className="py-2">NT$ {p.amount.toLocaleString()}</td>
              <td className="py-2">
                <PaymentStatusBadge status={p.status} />
              </td>
              <td className="py-2 text-stone-500">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function KycWidget({ kyc }: { kyc: PortalData['kyc'] }) {
  if (kyc.length === 0) {
    return (
      <Card title="KYC 審查進度">
        <p className="text-stone-500 text-sm">KYC 審查尚未開始、光合創學會在合約簽訂前完成。</p>
      </Card>
    )
  }

  return (
    <Card title="KYC 審查進度">
      <ul className="divide-y divide-emerald-50">
        {kyc.map((k, i) => (
          <li key={i} className="py-3 flex items-center justify-between text-sm">
            <span>{k.checkType}</span>
            <KycStatusBadge status={k.status} />
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500 mt-4 pt-3 border-t border-emerald-50">
        KYC 共五項：商工登記、司法院裁判書、動產擔保、Google 搜尋、實質受益人審查。
        如顯示「異常」項目、光合創學會主動與您聯繫釐清、不影響服務。
      </p>
    </Card>
  )
}

function MonthlyReportWidget({ monthlyReport }: { monthlyReport: PortalData['monthlyReport'] }) {
  const nextDate = new Date(monthlyReport.nextEstimatedAt)
  const dateStr = `${nextDate.getFullYear()} 年 ${nextDate.getMonth() + 1} 月 ${nextDate.getDate()} 日`

  return (
    <Card title="月度報告">
      <div className="text-sm space-y-3">
        <p className="text-stone-700">
          光合創學每月 1 號自動寄送月度報告至您的聯絡 email、含上月使用情形、繳款狀態、續約提醒。
        </p>
        <p className="text-emerald-800 font-medium">下次預估寄送日：{dateStr}</p>
        {monthlyReport.lastSentAt ? (
          <p className="text-stone-500">上次寄送日：{formatDate(monthlyReport.lastSentAt)}</p>
        ) : (
          <p className="text-stone-500 text-xs">尚未寄出第一份月報。</p>
        )}
      </div>
    </Card>
  )
}

function FooterNote({ contactName }: { contactName: string }) {
  return (
    <div className="text-center text-xs text-stone-500 py-6 leading-relaxed">
      <p>
        {contactName} 您好、若需修改資料或有任何疑問，請以原寄此連結的方式聯絡光合創學承辦人員。
      </p>
      <p className="mt-2">
        光合創學股份有限公司 · 統編 60350883 · 台北市大安區和平東路三段 280 號 2 樓之一
      </p>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'good' | 'warn'
}) {
  const valueClass =
    highlight === 'good'
      ? 'text-emerald-700 font-semibold'
      : highlight === 'warn'
        ? 'text-amber-700 font-semibold'
        : 'text-stone-800'
  return (
    <div>
      <dt className="text-stone-500 text-xs mb-1">{label}</dt>
      <dd className={valueClass}>{value}</dd>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const cls =
    status === '已繳'
      ? 'bg-emerald-100 text-emerald-800'
      : status === '逾期'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-amber-100 text-amber-800'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>{status}</span>
}

function KycStatusBadge({ status }: { status: string }) {
  const cls =
    status === '通過'
      ? 'bg-emerald-100 text-emerald-800'
      : status === '異常'
        ? 'bg-rose-100 text-rose-800'
        : 'bg-stone-100 text-stone-700'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs ${cls}`}>{status}</span>
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}
