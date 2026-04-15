export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import PrintButton from '@/components/print/PrintButton'

export default async function PrintConsentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('space_clients')
    .select(`
      service_type,
      organization:organizations(*)
    `)
    .eq('id', id)
    .single()

  if (!client) notFound()
  const org = (client as any).organization

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="print:hidden fixed top-4 right-4 flex gap-2 z-50">
        <PrintButton />
        <a href={`/clients/${id}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-stone-200 text-stone-700 hover:bg-stone-300">返回</a>
      </div>

      <style>{`@media print { @page { margin: 2cm; size: A4; } body { font-family: 'Noto Sans TC', 'PingFang TC', sans-serif; } }`}</style>

      <div className="max-w-3xl mx-auto px-10 py-16 font-sans">
        <div className="border-b-2 border-stone-900 pb-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">光</div>
            <div>
              <p className="text-xs text-stone-500">光合創學 | Guanghe</p>
              <p className="text-sm font-bold text-stone-900">個人資料蒐集、處理及利用同意書</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">個人資料蒐集、處理及利用同意書</h1>
          <p className="text-sm text-stone-600 mt-2">依據《個人資料保護法》第 8 條告知義務</p>
        </div>

        <section className="text-sm space-y-4 text-stone-800 leading-relaxed">
          <p>
            本人同意提供個人資料予 <strong>光合創學有限公司</strong>（以下稱「本公司」），
            並同意本公司依《個人資料保護法》及相關法令之規定，於下列範圍內蒐集、處理及利用本人之個人資料：
          </p>

          <div>
            <p className="font-semibold mb-1">一、蒐集目的</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>商業中心空間服務契約之履行（借址登記、共享工位、場地租借）</li>
              <li>依《洗錢防制法》進行客戶審查（KYC / CDD）與實質受益人審查</li>
              <li>信件代收、稅務申報、合約管理等業務必要用途</li>
              <li>政府補助申請與核銷（如涉及）</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">二、蒐集之個人資料類別</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>識別類：姓名、身分證字號、出生年月日</li>
              <li>聯絡類：地址、電話、Email、LINE 帳號</li>
              <li>財務類：統一編號、公司登記資料、合約金額</li>
              <li>特徵類：職業、職稱、公司名稱</li>
              <li>其他：業務所必要之其他資料</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">三、利用期間、地區、對象及方式</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><span className="font-medium">期間：</span>契約存續期間，及契約終止後依法令規定保存年限（一般為 5 年，法院文書相關 7 年）</li>
              <li><span className="font-medium">地區：</span>中華民國境內</li>
              <li><span className="font-medium">對象：</span>本公司、本公司依法令或契約委託之協力廠商（如記帳事務所、律師、金融機構、政府機關）</li>
              <li><span className="font-medium">方式：</span>以電子或紙本方式處理與利用</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold mb-1">四、當事人權利</p>
            <p className="pl-4">您得依個資法第 3 條規定，就您的個人資料行使以下權利：</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>查詢或請求閱覽</li>
              <li>請求製給複製本</li>
              <li>請求補充或更正</li>
              <li>請求停止蒐集、處理或利用</li>
              <li>請求刪除</li>
            </ul>
            <p className="pl-4 mt-2">如需行使上述權利，請聯絡本公司聯絡窗口。</p>
          </div>

          <div>
            <p className="font-semibold mb-1">五、不提供個人資料之影響</p>
            <p className="pl-4">
              若您不提供必要之個人資料，本公司將無法履行空間服務契約或完成相關法定義務（如 KYC 審查），本公司得拒絕提供服務或終止契約。
            </p>
          </div>

          <div>
            <p className="font-semibold mb-1">六、資料安全</p>
            <p className="pl-4">
              本公司將採取合理之安全措施保護您的個人資料，防止未經授權之存取、洩漏、修改或毀損。
              如發生資料外洩事件，將依法令規定於 72 小時內通報主管機關並通知當事人。
            </p>
          </div>
        </section>

        <section className="mt-10 pt-6 border-t border-stone-300">
          <p className="text-sm font-semibold mb-4">本人已詳閱並同意上述條款：</p>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-xs text-stone-500 mb-1">立同意書人（公司／個人）</p>
              <p className="font-semibold">{org?.name || '—'}</p>
              {org?.tax_id && <p className="text-stone-700 mt-1">統一編號：{org.tax_id}</p>}
              <p className="text-stone-700 mt-1">負責人：{org?.contact_name || '—'}</p>
              <p className="text-stone-700 mt-1">聯絡電話：{org?.contact_phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-6">簽章</p>
              <div className="border-b border-stone-900 h-16" />
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-stone-500 mt-12">
          中華民國 {new Date().getFullYear() - 1911} 年 {new Date().getMonth() + 1} 月 {new Date().getDate()} 日
        </p>
      </div>
    </div>
  )
}
