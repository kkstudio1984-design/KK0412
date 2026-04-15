import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('incidents')
      .select('*, reporter:profiles!reported_by(name), resolver:profiles!resolved_by(name)')
      .eq('space_client_id', id)
      .order('occurred_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: '載入事件失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { incidentType, severity, title, description, occurredAt } = body
    if (!title || !incidentType) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    const { data, error } = await supabase.from('incidents').insert({
      space_client_id: id,
      incident_type: incidentType,
      severity: severity || '中',
      title,
      description: description || null,
      reported_by: user?.id || null,
      occurred_at: occurredAt || new Date().toISOString(),
      status: '處理中',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增事件失敗' }, { status: 500 })
  }
}
