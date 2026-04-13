import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { sessionDate, startTime, location, orgId } = body
    if (!sessionDate) return NextResponse.json({ error: '缺少場次日期' }, { status: 400 })
    const { data, error } = await supabase.from('course_sessions').insert({
      course_id: id, session_date: sessionDate, start_time: startTime || null,
      location: location || null, org_id: orgId || null, status: '規劃中',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增場次失敗' }, { status: 500 })
  }
}
