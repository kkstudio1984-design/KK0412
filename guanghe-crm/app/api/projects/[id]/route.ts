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
      .from('projects')
      .select('*, organization:organizations(*), tasks(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/projects/[id]]', error)
    return NextResponse.json({ error: '載入專案失敗' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.projectType !== undefined) updateData.project_type = body.projectType
    if (body.status !== undefined) updateData.status = body.status
    if (body.budget !== undefined) updateData.budget = parseInt(body.budget)
    if (body.startDate !== undefined) updateData.start_date = body.startDate || null
    if (body.deadline !== undefined) updateData.deadline = body.deadline || null
    if (body.notes !== undefined) updateData.notes = body.notes

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]]', error)
    return NextResponse.json({ error: '更新專案失敗' }, { status: 500 })
  }
}
