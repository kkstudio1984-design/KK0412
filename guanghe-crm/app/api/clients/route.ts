import { createClient } from '@/lib/supabase/server'
import { KYC_CHECK_TYPES } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients — 看板用，含 hasOverduePayment
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: clients, error } = await supabase
      .from('space_clients')
      .select(`
        *,
        organization:organizations(*),
        kyc_checks(*),
        payments(status)
      `)
      .order('created_at', { ascending: true })

    if (error) throw error
    return NextResponse.json(clients)
  } catch (error) {
    console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: '載入客戶失敗' }, { status: 500 })
  }
}

// POST /api/clients — 建立 org + space_client (+ KYC if 借址)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const {
      name, taxId, contactName, contactPhone, contactEmail, contactLine, source, orgNotes,
      serviceType, plan, monthlyFee, notes,
    } = body

    if (!name || !contactName || !serviceType) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        tax_id: taxId || null,
        contact_name: contactName,
        contact_phone: contactPhone || null,
        contact_email: contactEmail || null,
        contact_line: contactLine || null,
        source: source || '其他',
        notes: orgNotes || null,
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Create space_client
    const { data: client, error: clientError } = await supabase
      .from('space_clients')
      .insert({
        org_id: org.id,
        service_type: serviceType,
        plan: plan || null,
        monthly_fee: monthlyFee ? parseInt(monthlyFee) : 0,
        stage: '初步詢問',
        notes: notes || null,
        red_flags: [],
      })
      .select()
      .single()

    if (clientError) throw clientError

    // Create KYC checks for 借址登記
    if (serviceType === '借址登記') {
      const kycRecords = KYC_CHECK_TYPES.map((checkType) => ({
        space_client_id: client.id,
        check_type: checkType,
        status: '待查' as const,
      }))

      const { error: kycError } = await supabase
        .from('kyc_checks')
        .insert(kycRecords)

      if (kycError) throw kycError
    }

    // Auto-create document checklist based on service_type
    const docTemplates: Record<string, { document_type: string; required: boolean }[]> = {
      '借址登記': [
        { document_type: '負責人雙證件影本', required: true },
        { document_type: '公司名稱預查核准函或設立/變更登記表影本', required: true },
        { document_type: '經濟部商工登記公示資料列印本', required: true },
        { document_type: '實質受益人聲明書/審查表', required: true },
        { document_type: '股東名冊', required: true },
        { document_type: '公司大小章', required: true },
        { document_type: '蓋印合約', required: true },
      ],
      '共享工位': [
        { document_type: '承租方身分證或公司變更登記表', required: true },
        { document_type: '實際進駐人員名單', required: true },
      ],
    }

    const templates = docTemplates[serviceType]
    if (templates) {
      const docRecords = templates.map((t) => ({
        space_client_id: client.id,
        document_type: t.document_type,
        required: t.required,
        status: '未繳' as const,
      }))

      const { error: docError } = await supabase
        .from('client_documents')
        .insert(docRecords)

      if (docError) throw docError
    }

    return NextResponse.json({ org, client }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients]', error)
    return NextResponse.json({ error: '新增客戶失敗' }, { status: 500 })
  }
}
