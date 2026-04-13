import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/finance/expenses]', error)
    return NextResponse.json({ error: '載入費用失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { category, amount, expenseDate, description } = body

    if (!category || !amount || !expenseDate || !description) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        category,
        amount: parseInt(amount),
        expense_date: expenseDate,
        description,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/finance/expenses]', error)
    return NextResponse.json({ error: '新增費用失敗' }, { status: 500 })
  }
}
