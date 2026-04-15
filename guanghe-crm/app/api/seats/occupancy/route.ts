import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { seatId, spaceClientId, visitorLogId, occupantName, occupantType } = body
    const { data, error } = await supabase.from('seat_occupancy').insert({
      seat_id: seatId,
      space_client_id: spaceClientId || null,
      visitor_log_id: visitorLogId || null,
      occupant_name: occupantName,
      occupant_type: occupantType,
      check_in_time: new Date().toISOString(),
    }).select('*, space_client:space_clients(organization:organizations(name))').single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '分配失敗' }, { status: 500 }) }
}
