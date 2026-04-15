export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PrintButton from '@/components/print/PrintButton'

export default async function PrintReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: payment } = await supabase
    .from('payments')
    .select(`
      *,
      space_client:space_clients(
        service_type,
        organization:organizations(*)
      ),
      contract:contracts(contract_type, payment_cycle)
    `)
    .eq('id', id)
    .single()

  if (!payment || payment.status !== '已收') notFound()

  const org = (payment.space_client as any)?.organization
  const sc = payment.space_client as any
  const ct = payment.contract as any

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <PrintButton />
        <a href={`/clients/${payment.space_client_id}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-200 text-stone-700 hover:bg-stone-300">
          返回
        </a>
      </div>

      <style>{`
        @media print {
          @page { margin: 2cm; size: A4; }
          body { font-family: 'Noto Sans TC', 'PingFang TC', sans-serif; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-10 py-16 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-amber-500 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-xl">光</div>
            <div>
              <p className="text-xs text-stone-500">Guanghe</p>
              <p className="text-lg font-bold text-stone-900">光合創學有限公司</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-amber-700">收 據</h1>
            <p className="text-xs text-stone-500 mt-1">RECEIPT</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div>
            <p className="text-xs text-stone-500 mb-1">收據編號</p>
            <p className="font-mono font-semibold">GH-R-{payment.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-1">開立日期</p>
            <p className="font-semibold">{payment.paid_at ? format(new Date(payment.paid_at), 'yyyy/MM/dd') : '—'}</p>
          </div>
        </div>

        {/* Payer */}
        <section className="mb-6">
          <p className="text-xs text-stone-500 mb-2">茲收到</p>
          <p className="text-xl font-bold text-stone-900">{org?.name || '—'}</p>
          {org?.tax_id && <p className="text-sm text-stone-600 mt-1">統一編號：{org.tax_id}</p>}
        </section>

        {/* Amount */}
        <section className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-8">
          <p className="text-xs text-stone-600 mb-2">繳付金額</p>
          <p className="text-4xl font-bold text-amber-700 tabular-nums">
            NT$ {payment.amount.toLocaleString()}
          </p>
          <p className="text-sm text-stone-600 mt-2">
            新台幣 <span className="font-semibold">{numberToChinese(payment.amount)}</span> 元整
          </p>
        </section>

        {/* Details */}
        <section className="mb-8">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-300 text-stone-600">
                <th className="text-left py-2 text-xs">項目</th>
                <th className="text-left py-2 text-xs">期間</th>
                <th className="text-right py-2 text-xs">金額</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stone-200">
                <td className="py-3">
                  <p className="font-medium">{ct?.contract_type || sc?.service_type || '服務費'}</p>
                  {ct?.payment_cycle && <p className="text-xs text-stone-500">{ct.payment_cycle}</p>}
                </td>
                <td className="py-3 text-stone-700">
                  {format(new Date(payment.due_date), 'yyyy/MM/dd')}
                </td>
                <td className="py-3 text-right font-semibold tabular-nums">
                  NT$ {payment.amount.toLocaleString()}
                </td>
              </tr>
              <tr className="font-bold text-stone-900">
                <td className="py-3" colSpan={2}>合計</td>
                <td className="py-3 text-right tabular-nums">NT$ {payment.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Signature */}
        <section className="mt-16 grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs text-stone-500 mb-8">開立單位</p>
            <p className="font-bold">光合創學有限公司</p>
            <p className="text-sm text-stone-600 mt-1">公司用印：</p>
            <div className="mt-2 border border-stone-300 rounded-lg h-20" />
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-8">經手人</p>
            <div className="border-b border-stone-900 h-12" />
            <p className="text-xs text-stone-500 mt-2">簽章</p>
          </div>
        </section>

        <p className="text-center text-xs text-stone-400 mt-12">
          此收據為電腦列印，無須另行簽章
        </p>
      </div>
    </div>
  )
}

// Simple Chinese numeral converter for common amounts
function numberToChinese(num: number): string {
  const chars = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖']
  const units = ['', '拾', '佰', '仟', '萬', '拾萬', '佰萬', '仟萬', '億']
  const str = Math.floor(num).toString()
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const digit = parseInt(str[i])
    const unit = units[str.length - 1 - i]
    if (digit === 0) {
      if (!result.endsWith('零') && i < str.length - 1) result += '零'
    } else {
      result += chars[digit] + unit
    }
  }
  return result.replace(/零+$/, '') || '零'
}
