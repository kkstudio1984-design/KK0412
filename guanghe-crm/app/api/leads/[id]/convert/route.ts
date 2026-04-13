import { createClient } from '@/lib/supabase/server'
import { KYC_CHECK_TYPES } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

const INTEREST_TO_SERVICE: Record<string, string> = {
  '借址登記': '借址登記',
  '工位': '共享工位',
  '場地': '場地租借',
}

const BORROWING_DOCS = [
  '負責人雙證件影本', '公司名稱預查核准函或設立/變更登記表影本',
  '經濟部商工登記公示資料列印本', '實質受益人聲明書/審查表',
  '股東名冊', '公司大小章', '蓋印合約',
]
const COWORK_DOCS = ['承租方身分證或公司變更登記表', '實際進駐人員名單']

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: '找不到潛在客戶' }, { status: 404 })
    }

    if (lead.converted_to) {
      return NextResponse.json({ error: '此潛在客戶已轉換' }, { status: 400 })
    }

    const serviceType = INTEREST_TO_SERVICE[lead.interest]
    if (!serviceType) {
      return NextResponse.json({ error: `暫不支援轉換「${lead.interest}」類型的潛在客戶` }, { status: 400 })
    }

    // Create or use existing organization
    let orgId = lead.org_id
    if (!orgId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: lead.contact_name + ' (自動建立)',
          contact_name: lead.contact_name,
          contact_phone: lead.contact_info || null,
          source: lead.channel === 'BNI' ? 'BNI轉介' : lead.channel === '轉介' ? '其他' : '自來客',
          org_type: '客戶',
        })
        .select()
        .single()

      if (orgError) throw orgError
      orgId = org.id
    }

    // Create space_client
    const { data: client, error: clientError } = await supabase
      .from('space_clients')
      .insert({
        org_id: orgId,
        service_type: serviceType,
        stage: '初步詢問',
        monthly_fee: 0,
        red_flags: [],
        notes: lead.notes || null,
      })
      .select()
      .single()

    if (clientError) throw clientError

    // Create KYC checks for 借址登記
    if (serviceType === '借址登記') {
      const kycRecords = KYC_CHECK_TYPES.map((checkType) => ({
        space_client_id: client.id,
        check_type: checkType,
        status: '待查',
      }))
      await supabase.from('kyc_checks').insert(kycRecords)
    }

    // Create document checklist
    const docs = serviceType === '借址登記' ? BORROWING_DOCS : serviceType === '共享工位' ? COWORK_DOCS : []
    if (docs.length > 0) {
      const docRecords = docs.map((docType) => ({
        space_client_id: client.id,
        document_type: docType,
        required: true,
        status: '未繳',
      }))
      await supabase.from('client_documents').insert(docRecords)
    }

    // Update lead as converted
    await supabase
      .from('leads')
      .update({
        converted_to: `space_client:${client.id}`,
        stage: '成交',
      })
      .eq('id', id)

    return NextResponse.json({ clientId: client.id, orgId }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/leads/[id]/convert]', error)
    return NextResponse.json({ error: '轉換失敗' }, { status: 500 })
  }
}
