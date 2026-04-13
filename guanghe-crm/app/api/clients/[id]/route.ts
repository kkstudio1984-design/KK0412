import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients/[id] — 完整資料（含 KYC + payments）
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: client, error } = await supabase
      .from('space_clients')
      .select(`
        *,
        organization:organizations(*),
        kyc_checks(*),
        payments(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!client) {
      return NextResponse.json({ error: '找不到客戶' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('[GET /api/clients/[id]]', error)
    return NextResponse.json({ error: '載入客戶失敗' }, { status: 500 })
  }
}

// PATCH /api/clients/[id] — 更新欄位（含 stage KYC 鎖定）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    // KYC 鎖定規則（借址登記 → 已簽約 需全部通過）
    if (body.stage === '已簽約') {
      const { data: client } = await supabase
        .from('space_clients')
        .select('service_type, kyc_checks(status)')
        .eq('id', id)
        .single()

      if (client?.service_type === '借址登記') {
        const allPassed = (client.kyc_checks || []).every((k: any) => k.status === '通過')
        if (!allPassed) {
          return NextResponse.json(
            { error: 'KYC 尚未全部通過，無法推進到已簽約' },
            { status: 422 }
          )
        }
      }
    }

    // Update space_client fields
    const updateData: any = {}
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.nextAction !== undefined) updateData.next_action = body.nextAction
    if (body.followUpDate !== undefined) updateData.follow_up_date = body.followUpDate || null
    if (body.redFlags !== undefined) updateData.red_flags = body.redFlags
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.plan !== undefined) updateData.plan = body.plan
    if (body.monthlyFee !== undefined) updateData.monthly_fee = parseInt(body.monthlyFee)

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('space_clients')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    }

    // Update organization fields if provided
    if (body.orgName || body.contactName || body.contactPhone ||
        body.contactEmail || body.contactLine || body.taxId || body.source) {
      // First get org_id
      const { data: sc } = await supabase
        .from('space_clients')
        .select('org_id')
        .eq('id', id)
        .single()

      if (sc) {
        const orgUpdate: any = {}
        if (body.orgName) orgUpdate.name = body.orgName
        if (body.contactName !== undefined) orgUpdate.contact_name = body.contactName
        if (body.contactPhone !== undefined) orgUpdate.contact_phone = body.contactPhone
        if (body.contactEmail !== undefined) orgUpdate.contact_email = body.contactEmail
        if (body.contactLine !== undefined) orgUpdate.contact_line = body.contactLine
        if (body.taxId !== undefined) orgUpdate.tax_id = body.taxId
        if (body.source !== undefined) orgUpdate.source = body.source

        const { error } = await supabase
          .from('organizations')
          .update(orgUpdate)
          .eq('id', sc.org_id)

        if (error) throw error
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]]', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
