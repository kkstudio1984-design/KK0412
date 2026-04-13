import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.purpose !== undefined) updateData.purpose = body.purpose
    if (body.targetModule !== undefined) updateData.target_module = body.targetModule
    if (body.promptVersion !== undefined) updateData.prompt_version = body.promptVersion
    if (body.performanceNotes !== undefined) updateData.performance_notes = body.performanceNotes
    updateData.last_updated = new Date().toISOString().split('T')[0]
    const { error } = await supabase.from('agents').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
