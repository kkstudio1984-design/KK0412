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
    if (body.usedByModules !== undefined) updateData.used_by_modules = body.usedByModules
    if (body.costMonthly !== undefined) updateData.cost_monthly = body.costMonthly ? parseInt(body.costMonthly) : null
    if (body.status !== undefined) updateData.status = body.status
    const { error } = await supabase.from('ai_tools').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
