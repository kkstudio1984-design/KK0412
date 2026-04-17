export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PrintButton from '@/components/print/PrintButton'

export default async function PrintContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      *,
      space_client:space_clients(
        service_type,
        plan,
        organization:organizations(*)
      )
    `)
    .eq('id', id)
    .single()

  if (!contract) notFound()

  const org = (contract.space_client as any)?.organization
  const sc = contract.space_client as any

  return (
    <div className="min-h-screen bg-white text-black">
      {/* No-print toolbar */}
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <PrintButton />
        <a href={`/clients/${contract.space_client_id}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-200 text-stone-700 hover:bg-stone-300">
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
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">光</div>
            <div>
              <p className="text-xs text-stone-500">光合創學 | Guanghe</p>
              <p className="text-sm font-bold text-stone-900">{contract.contract_type}合約書</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{contract.contract_type}合約書</h1>
          <p className="text-sm text-stone-600 mt-1">合約編號：GH-{contract.id.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Parties */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-stone-900 mb-3">立合約書人</h2>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs text-stone-500 mb-1">出租方（甲方）</p>
              <p className="font-semibold">光合創學有限公司</p>
              <p className="text-stone-700 mt-1">三院空間</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">承租方（乙方）</p>
              <p className="font-semibold">{org?.name || '—'}</p>
              <p className="text-stone-700 mt-1">負責人：{org?.contact_name || '—'}</p>
              {org?.tax_id && <p className="text-stone-700">統一編號：{org.tax_id}</p>}
              {org?.contact_phone && <p className="text-stone-700">聯絡電話：{org.contact_phone}</p>}
            </div>
          </div>
        </section>

        {/* Terms */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-stone-900 mb-3">合約條款</h2>
          <div className="text-sm space-y-3 text-stone-800 leading-relaxed">
            <p><span className="font-semibold">第一條（服務內容）</span></p>
            <p className="pl-4">
              甲方提供乙方 <span className="font-semibold text-amber-700">{contract.contract_type}</span> 服務
              {sc?.plan && <>，方案：<span className="font-semibold">{sc.plan}</span></>}。
            </p>

            <p><span className="font-semibold">第二條（合約期間）</span></p>
            <p className="pl-4">
              自 <span className="font-semibold">{format(new Date(contract.start_date), 'yyyy年MM月dd日')}</span> 起，
              至 <span className="font-semibold">{format(new Date(contract.end_date), 'yyyy年MM月dd日')}</span> 止。
            </p>

            <p><span className="font-semibold">第三條（費用及繳付方式）</span></p>
            <p className="pl-4">
              月租金：新台幣 <span className="font-semibold">{contract.monthly_rent.toLocaleString()}</span> 元整。
              繳款週期：<span className="font-semibold">{contract.payment_cycle}</span>。
            </p>

            <p><span className="font-semibold">第四條（押金）</span></p>
            <p className="pl-4">
              乙方應於簽約時繳納押金新台幣 <span className="font-semibold">{contract.deposit_amount.toLocaleString()}</span> 元整，
              於合約終止、結清欠款及恢復場地原狀後無息返還。
            </p>

            <p><span className="font-semibold">第五條（KYC與合規義務）</span></p>
            <p className="pl-4">
              乙方同意提供商工登記、司法院裁判書、動產擔保、Google 搜尋、實質受益人審查等 KYC 查核所需資料，
              並保證所提供資料真實無偽。
            </p>

            <p><span className="font-semibold">第六條（遷出與違約）</span></p>
            <p className="pl-4">
              合約終止後 30 日內，乙方應完成公司登記地址遷出；
              逾 30 日未完成者，甲方得扣抵押金 50%；
              逾 60 日未完成者，甲方得沒收全額押金並單方申請廢止登記。
            </p>

            <p><span className="font-semibold">第七條（管轄法院）</span></p>
            <p className="pl-4">因本合約發生爭議時，雙方合意以臺灣台北地方法院為第一審管轄法院。</p>
          </div>
        </section>

        {/* Signatures */}
        <section className="mt-16 grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-bold mb-6">甲方：光合創學有限公司</p>
            <p className="text-stone-600 text-xs mb-2">負責人簽章：</p>
            <div className="border-b border-stone-900 h-12" />
          </div>
          <div>
            <p className="font-bold mb-6">乙方：{org?.name || '—'}</p>
            <p className="text-stone-600 text-xs mb-2">負責人簽章：</p>
            <div className="border-b border-stone-900 h-12" />
          </div>
        </section>

        {/* E-signature stamp */}
        {(contract as any).signing_status === '已簽署' && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
              <span style={{ color: '#16a34a', fontSize: '0.85rem' }}>✓</span>
              <div>
                <p style={{ color: '#15803d', fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>已完成電子簽署</p>
                <p style={{ color: '#4ade80', fontSize: '0.7rem', margin: 0 }}>
                  簽署人：{(contract as any).signer_name || '—'}
                  {(contract as any).signed_at && ` · ${format(new Date((contract as any).signed_at), 'yyyy年MM月dd日 HH:mm')}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-stone-500 mt-12">
          中華民國 {new Date().getFullYear() - 1911} 年 {new Date().getMonth() + 1} 月 {new Date().getDate()} 日
        </p>
      </div>
    </div>
  )
}
