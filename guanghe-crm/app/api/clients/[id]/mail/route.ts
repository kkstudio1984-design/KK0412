import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('mail_records')
      .select('*')
      .eq('space_client_id', id)
      .order('received_date', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/clients/[id]/mail]', error)
    return NextResponse.json({ error: '載入信件失敗' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { receivedDate, mailType, trackingNumber, sender } = body

    const { data, error } = await supabase
      .from('mail_records')
      .insert({
        space_client_id: id,
        received_date: receivedDate,
        mail_type: mailType,
        tracking_number: trackingNumber || null,
        sender,
        pickup_status: '待領取',
        notified_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients/[id]/mail]', error)
    return NextResponse.json({ error: '新增信件失敗' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { mailId, pickupStatus } = body

    const updateData: Record<string, unknown> = { pickup_status: pickupStatus }
    if (pickupStatus === '已領取') updateData.picked_up_at = new Date().toISOString()
    if (pickupStatus === '已退回') updateData.final_notice_at = new Date().toISOString()

    const { error } = await supabase
      .from('mail_records')
      .update(updateData)
      .eq('id', mailId)
      .eq('space_client_id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/mail]', error)
    return NextResponse.json({ error: '更新信件失敗' }, { status: 500 })
  }
}
