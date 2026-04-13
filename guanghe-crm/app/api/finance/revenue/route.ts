import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('revenue_records')
      .select('*')
      .order('revenue_date', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/finance/revenue]', error)
    return NextResponse.json({ error: '載入營收失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { sourceModule, sourceId, amount, revenueDate, category, status, description } = body

    const { data, error } = await supabase
      .from('revenue_records')
      .insert({
        source_module: sourceModule,
        source_id: sourceId || null,
        amount: parseInt(amount),
        revenue_date: revenueDate,
        category,
        status: status || '未收',
        description: description || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/finance/revenue]', error)
    return NextResponse.json({ error: '新增營收失敗' }, { status: 500 })
  }
}
