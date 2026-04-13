import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()
    const body = await req.json()
    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.actualParticipants !== undefined) updateData.actual_participants = parseInt(body.actualParticipants)
    if (body.revenue !== undefined) updateData.revenue = parseInt(body.revenue)
    if (body.location !== undefined) updateData.location = body.location
    const { error } = await supabase.from('course_sessions').update(updateData).eq('id', sessionId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新場次失敗' }, { status: 500 })
  }
}
