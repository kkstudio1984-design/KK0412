import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { reconciliationDate, openingBalance, cashIn, cashOut, expectedBalance, actualBalance, notes } = body
    const variance = actualBalance - expectedBalance
    const status = Math.abs(variance) >= 100 ? '異常' : '已結'
    const { data, error } = await supabase.from('cash_reconciliations').insert({
      reconciliation_date: reconciliationDate,
      opening_balance: openingBalance,
      cash_in: cashIn,
      cash_out: cashOut,
      expected_balance: expectedBalance,
      actual_balance: actualBalance,
      variance,
      status,
      notes: notes || null,
      reconciled_by: user?.id || null,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '盤點失敗' }, { status: 500 }) }
}
