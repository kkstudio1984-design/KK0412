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
    if (body.tier !== undefined) updateData.tier = body.tier
    if (body.annualAmount !== undefined) updateData.annual_amount = parseInt(body.annualAmount)
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate
    if (body.deliverables !== undefined) updateData.deliverables = body.deliverables
    if (body.status !== undefined) updateData.status = body.status

    const { error } = await supabase
      .from('sponsorships')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/sponsorships/[id]]', error)
    return NextResponse.json({ error: '更新贊助合約失敗' }, { status: 500 })
  }
}
