import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; incidentId: string }> }) {
  try {
    const { incidentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const updateData: Record<string, unknown> = {}
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === '已解決' || body.status === '已結案') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = user?.id || null
      }
    }
    if (body.resolution !== undefined) updateData.resolution = body.resolution
    if (body.severity !== undefined) updateData.severity = body.severity
    const { error } = await supabase.from('incidents').update(updateData).eq('id', incidentId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
