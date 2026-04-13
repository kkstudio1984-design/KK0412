import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('ai_tools').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: '載入失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { name, purpose, usedByModules, costMonthly, status } = body
    if (!name) return NextResponse.json({ error: '缺少工具名稱' }, { status: 400 })
    const { data, error } = await supabase.from('ai_tools').insert({
      name, purpose: purpose || null, used_by_modules: usedByModules || [],
      cost_monthly: costMonthly ? parseInt(costMonthly) : null, status: status || '評估中',
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
