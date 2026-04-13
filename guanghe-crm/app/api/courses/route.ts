import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('courses').select('*, course_sessions(id, status)').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: '載入課程失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { name, courseType, durationHours, price, maxParticipants, description } = body
    if (!name || !courseType) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    const { data, error } = await supabase.from('courses').insert({
      name, course_type: courseType, duration_hours: parseFloat(durationHours) || 1,
      price: parseInt(price) || 0, max_participants: parseInt(maxParticipants) || 30,
      description: description || null,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增課程失敗' }, { status: 500 })
  }
}
