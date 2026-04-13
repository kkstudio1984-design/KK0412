import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/projects/[id]/tasks]', error)
    return NextResponse.json({ error: '載入任務失敗' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { title, partnerId, dueDate } = body

    if (!title) {
      return NextResponse.json({ error: '缺少任務名稱' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: id,
        title,
        partner_id: partnerId || null,
        due_date: dueDate || null,
        status: '待分配',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects/[id]/tasks]', error)
    return NextResponse.json({ error: '新增任務失敗' }, { status: 500 })
  }
}
