import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sponsorships')
      .select('*, organization:organizations(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/sponsorships]', error)
    return NextResponse.json({ error: '載入贊助合約失敗' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()
    const { orgId, tier, annualAmount, startDate, endDate, deliverables, status } = body

    if (!orgId || !tier || !annualAmount || !startDate || !endDate) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sponsorships')
      .insert({
        org_id: orgId,
        tier,
        annual_amount: parseInt(annualAmount),
        start_date: startDate,
        end_date: endDate,
        deliverables: deliverables || null,
        status: status || '洽談中',
      })
      .select('*, organization:organizations(*)')
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[POST /api/sponsorships]', error)
    return NextResponse.json({ error: '新增贊助合約失敗' }, { status: 500 })
  }
}
