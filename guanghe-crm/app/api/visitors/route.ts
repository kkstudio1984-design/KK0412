import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('visitor_logs')
      .select('*, host_client:space_clients(organization:organizations(name))')
      .order('check_in_time', { ascending: false })
      .limit(50)
    if (error) throw error
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: '載入失敗' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { visitorName, visitorPhone, visitorCompany, purpose, hostClientId, hostNote, notes } = body
    if (!visitorName) return NextResponse.json({ error: '缺少訪客姓名' }, { status: 400 })
    const { data, error } = await supabase.from('visitor_logs').insert({
      visitor_name: visitorName,
      visitor_phone: visitorPhone || null,
      visitor_company: visitorCompany || null,
      purpose,
      host_client_id: hostClientId || null,
      host_note: hostNote || null,
      notes: notes || null,
      check_in_time: new Date().toISOString(),
    }).select('*, host_client:space_clients(organization:organizations(name))').single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '登記失敗' }, { status: 500 }) }
}
