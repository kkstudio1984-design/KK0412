import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; earningId: string }> }
) {
  try {
    const { earningId } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { status, description, periodMonth, amount } = body

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const patch: Record<string, unknown> = {}
    if (description !== undefined) patch.description = description
    if (periodMonth !== undefined) patch.period_month = periodMonth
    if (amount !== undefined) patch.amount = Number(amount)

    if (status) {
      patch.status = status
      if (status === '已累積') {
        patch.approved_by = user?.id || null
        patch.approved_at = new Date().toISOString()
      } else if (status === '已支付') {
        patch.paid_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('partner_earnings')
      .update(patch)
      .eq('id', earningId)
      .select('*, task:tasks(title, project:projects(name))')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
