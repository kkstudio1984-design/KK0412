import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false })
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
    const { name, purpose, targetModule, promptVersion, performanceNotes } = body
    if (!name) return NextResponse.json({ error: '缺少名稱' }, { status: 400 })
    const { data, error } = await supabase.from('agents').insert({
      name, purpose: purpose || null, target_module: targetModule || null,
      prompt_version: promptVersion || null, last_updated: new Date().toISOString().split('T')[0],
      performance_notes: performanceNotes || null,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
