import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('onboarded_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: '載入失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { name, disabilityType, disabilityLevel, skillLevel, employmentType, onboardedAt } = body
    if (!name) return NextResponse.json({ error: '缺少姓名' }, { status: 400 })
    const { data, error } = await supabase
      .from('partners')
      .insert({
        name,
        disability_type: disabilityType || null,
        disability_level: disabilityLevel || null,
        skill_level: skillLevel || '基礎',
        employment_type: employmentType || null,
        onboarded_at: onboardedAt || null,
        status: '培訓中',
      })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: '新增失敗' }, { status: 500 })
  }
}
