import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { description, amount, periodMonth, taskId, status } = body
    if (!amount) return NextResponse.json({ error: '缺少金額' }, { status: 400 })
    const { data, error } = await supabase
      .from('partner_earnings')
      .insert({
        partner_id: id,
        task_id: taskId || null,
        amount: Number(amount),
        status: status || '待結算',
        description: description || null,
        period_month: periodMonth || null,
      })
      .select('*, task:tasks(title, project:projects(name))')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
