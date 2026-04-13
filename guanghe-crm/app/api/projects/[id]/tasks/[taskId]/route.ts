import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { taskId } = await params
    const supabase = await createClient()
    const body = await req.json()

    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.title !== undefined) updateData.title = body.title
    if (body.partnerId !== undefined) updateData.partner_id = body.partnerId || null
    if (body.dueDate !== undefined) updateData.due_date = body.dueDate || null
    if (body.outputUrl !== undefined) updateData.output_url = body.outputUrl
    if (body.reviewNotes !== undefined) updateData.review_notes = body.reviewNotes

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/projects/[id]/tasks/[taskId]]', error)
    return NextResponse.json({ error: '更新任務失敗' }, { status: 500 })
  }
}
