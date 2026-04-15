import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { transactionDate, direction, amount, category, description } = body
    if (!amount || !direction) return NextResponse.json({ error: '缺少欄位' }, { status: 400 })
    const { data, error } = await supabase.from('cash_transactions').insert({
      transaction_date: transactionDate,
      direction,
      amount: parseInt(amount),
      category,
      description: description || null,
      recorded_by: user?.id || null,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '記錄失敗' }, { status: 500 }) }
}
