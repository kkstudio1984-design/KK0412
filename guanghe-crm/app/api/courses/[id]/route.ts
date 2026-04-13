import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase.from('courses').select('*, course_sessions(*, enrollments(id, payment_status, participant_name, participant_email))').eq('id', id).single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: '載入課程失敗' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.courseType !== undefined) updateData.course_type = body.courseType
    if (body.durationHours !== undefined) updateData.duration_hours = parseFloat(body.durationHours)
    if (body.price !== undefined) updateData.price = parseInt(body.price)
    if (body.maxParticipants !== undefined) updateData.max_participants = parseInt(body.maxParticipants)
    if (body.description !== undefined) updateData.description = body.description
    const { error } = await supabase.from('courses').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新課程失敗' }, { status: 500 })
  }
}
