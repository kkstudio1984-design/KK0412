import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('change_notifications')
      .select('*')
      .eq('space_client_id', id)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '載入失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { changeType, oldValue, newValue, notes } = body
    if (!changeType) return NextResponse.json({ error: '缺少變更類型' }, { status: 400 })
    const { data, error } = await supabase
      .from('change_notifications')
      .insert({
        space_client_id: id,
        change_type: changeType,
        old_value: oldValue || null,
        new_value: newValue || null,
        notes: notes || null,
        notification_status: '待通知',
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
