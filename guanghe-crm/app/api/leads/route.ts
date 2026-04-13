import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('leads')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/leads]', error)
    return NextResponse.json({ error: '載入潛在客戶失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { contactName, contactInfo, channel, interest, orgId, followUpDate, notes } = body

    if (!contactName || !channel || !interest) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('leads')
      .insert({
        contact_name: contactName,
        contact_info: contactInfo || null,
        channel,
        interest,
        org_id: orgId || null,
        follow_up_date: followUpDate || null,
        notes: notes || null,
        stage: '初步接觸',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/leads]', error)
    return NextResponse.json({ error: '新增潛在客戶失敗' }, { status: 500 })
  }
}
