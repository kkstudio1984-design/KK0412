import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { participantName, participantEmail, orgId } = body
    if (!participantName) return NextResponse.json({ error: '缺少學員姓名' }, { status: 400 })
    const { data, error } = await supabase.from('enrollments').insert({
      session_id: sessionId, participant_name: participantName,
      participant_email: participantEmail || null, org_id: orgId || null,
      payment_status: '未付',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增報名失敗' }, { status: 500 })
  }
}
