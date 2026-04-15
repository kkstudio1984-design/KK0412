import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const updateData: Record<string, unknown> = {}
    if (body.applicationStatus !== undefined) updateData.application_status = body.applicationStatus
    if (body.disbursementStatus !== undefined) updateData.disbursement_status = body.disbursementStatus
    if (body.notes !== undefined) updateData.notes = body.notes

    const { error } = await supabase
      .from('subsidy_tracking')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/finance/subsidies/[id]]', error)
    return NextResponse.json({ error: '更新補助失敗' }, { status: 500 })
  }
}
