import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*, organization:organizations(id, name, contact_name), tasks(id, status)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/projects]', error)
    return NextResponse.json({ error: '載入專案失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { orgId, name, projectType, budget, startDate, deadline, notes } = body

    if (!orgId || !name || !projectType) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        name,
        project_type: projectType,
        budget: budget ? parseInt(budget) : 0,
        start_date: startDate || null,
        deadline: deadline || null,
        notes: notes || null,
        status: '洽談中',
      })
      .select('*, organization:organizations(id, name, contact_name)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects]', error)
    return NextResponse.json({ error: '新增專案失敗' }, { status: 500 })
  }
}
