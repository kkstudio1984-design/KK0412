import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('subsidy_tracking')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/finance/subsidies]', error)
    return NextResponse.json({ error: '載入補助失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { subsidyName, agency, annualAmount, applicationStatus, notes } = body

    const { data, error } = await supabase
      .from('subsidy_tracking')
      .insert({
        subsidy_name: subsidyName,
        agency,
        annual_amount: parseInt(annualAmount),
        application_status: applicationStatus || '未申請',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/finance/subsidies]', error)
    return NextResponse.json({ error: '新增補助失敗' }, { status: 500 })
  }
}
