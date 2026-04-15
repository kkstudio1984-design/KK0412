import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('seats').select('*').order('seat_number')
    if (error) throw error
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: '載入失敗' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { seatNumber, zone, seatType, capacity } = body
    if (!seatNumber) return NextResponse.json({ error: '缺少座位編號' }, { status: 400 })
    const { data, error } = await supabase.from('seats').insert({
      seat_number: seatNumber,
      zone: zone || null,
      seat_type: seatType || '共享',
      capacity: capacity || 1,
      is_active: true,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '新增失敗' }, { status: 500 }) }
}
