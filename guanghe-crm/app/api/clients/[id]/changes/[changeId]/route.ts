import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; changeId: string }> }
) {
  try {
    const { changeId } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { notificationStatus, notifiedAgencies, notes } = body

    const patch: Record<string, unknown> = {}
    if (notificationStatus !== undefined) {
      patch.notification_status = notificationStatus
      if (notificationStatus === '已通知') {
        patch.notified_at = new Date().toISOString()
      }
    }
    if (notifiedAgencies !== undefined) patch.notified_agencies = notifiedAgencies
    if (notes !== undefined) patch.notes = notes

    const { data, error } = await supabase
      .from('change_notifications')
      .update(patch)
      .eq('id', changeId)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
