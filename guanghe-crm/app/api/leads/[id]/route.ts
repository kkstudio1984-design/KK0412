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
      .from('leads')
      .select('*, organization:organizations(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/leads/[id]]', error)
    return NextResponse.json({ error: '載入潛在客戶失敗' }, { status: 500 })
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

    const updateData: Record<string, unknown> = {}
    if (body.stage !== undefined) updateData.stage = body.stage
    if (body.contactName !== undefined) updateData.contact_name = body.contactName
    if (body.contactInfo !== undefined) updateData.contact_info = body.contactInfo
    if (body.channel !== undefined) updateData.channel = body.channel
    if (body.interest !== undefined) updateData.interest = body.interest
    if (body.followUpDate !== undefined) updateData.follow_up_date = body.followUpDate || null
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.orgId !== undefined) updateData.org_id = body.orgId || null
    if (body.convertedTo !== undefined) updateData.converted_to = body.convertedTo

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/leads/[id]]', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
