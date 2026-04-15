import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addDays, format } from 'date-fns'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('offboarding_records')
      .select('*')
      .eq('space_client_id', id)
      .order('request_date', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/clients/[id]/offboarding]', error)
    return NextResponse.json({ error: '載入退租紀錄失敗' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { contractEndDate, earlyTermination, penaltyAmount } = body

    const migrationDeadline = format(addDays(new Date(contractEndDate), 30), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('offboarding_records')
      .insert({
        space_client_id: id,
        request_date: format(new Date(), 'yyyy-MM-dd'),
        contract_end_date: contractEndDate,
        early_termination: earlyTermination || false,
        penalty_amount: penaltyAmount ? parseInt(penaltyAmount) : null,
        settlement_status: '待結算',
        address_migration_status: '待遷出',
        migration_deadline: migrationDeadline,
        deposit_refund_status: '待退',
        status: '進行中',
      })
      .select()
      .single()

    if (error) throw error

    // Also update space_client stage to 退租中
    await supabase
      .from('space_clients')
      .update({ stage: '退租中' })
      .eq('id', id)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients/[id]/offboarding]', error)
    return NextResponse.json({ error: '建立退租紀錄失敗' }, { status: 500 })
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
    const { recordId, ...updates } = body

    const updateData: Record<string, unknown> = {}
    if (updates.settlementStatus) updateData.settlement_status = updates.settlementStatus
    if (updates.addressMigrationStatus) {
      updateData.address_migration_status = updates.addressMigrationStatus
      if (updates.addressMigrationStatus === '已確認遷出') {
        updateData.migration_confirmed_at = new Date().toISOString()
      }
    }
    if (updates.depositRefundStatus) {
      updateData.deposit_refund_status = updates.depositRefundStatus
      if (updates.depositRefundAmount !== undefined) updateData.deposit_refund_amount = parseInt(updates.depositRefundAmount)
      if (updates.depositDeductionReason) updateData.deposit_deduction_reason = updates.depositDeductionReason
    }

    // Check if offboarding is complete (RULE-23)
    const { data: current } = await supabase
      .from('offboarding_records')
      .select('*')
      .eq('id', recordId)
      .single()

    if (current) {
      const merged = { ...current, ...updateData }
      if (
        merged.settlement_status === '已結算' &&
        merged.address_migration_status === '已確認遷出' &&
        ['已退', '全額沒收'].includes(merged.deposit_refund_status)
      ) {
        updateData.status = '已結案'
        updateData.closed_at = new Date().toISOString()
        // Update space_client stage to 已結案
        await supabase.from('space_clients').update({ stage: '已結案' }).eq('id', id)
      }
    }

    const { error } = await supabase
      .from('offboarding_records')
      .update(updateData)
      .eq('id', recordId)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/offboarding]', error)
    return NextResponse.json({ error: '更新退租紀錄失敗' }, { status: 500 })
  }
}
