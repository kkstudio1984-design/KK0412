import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients/[id]/payments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .eq('space_client_id', id)
      .order('due_date', { ascending: true })

    if (error) throw error
    return NextResponse.json(payments)
  } catch (error) {
    console.error('[GET /api/clients/[id]/payments]', error)
    return NextResponse.json({ error: '載入收款失敗' }, { status: 500 })
  }
}

// POST /api/clients/[id]/payments — 新增收款
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { dueDate, amount } = body

    const { data, error } = await supabase
      .from('payments')
      .insert({
        space_client_id: id,
        due_date: dueDate,
        amount: parseInt(amount),
        status: '未收',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients/[id]/payments]', error)
    return NextResponse.json({ error: '新增收款失敗' }, { status: 500 })
  }
}
