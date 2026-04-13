import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/clients/[id]/payments/[pid] — 切換收款狀態
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { pid } = await params
    const supabase = await createClient()
    const body = await req.json()

    const updateData: any = {}
    if (body.status !== undefined) updateData.status = body.status
    if (body.status === '已收') updateData.paid_at = new Date().toISOString()
    if (body.amount !== undefined) updateData.amount = parseInt(body.amount)

    const { error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', pid)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/payments/[pid]]', error)
    return NextResponse.json({ error: '更新收款失敗' }, { status: 500 })
  }
}
