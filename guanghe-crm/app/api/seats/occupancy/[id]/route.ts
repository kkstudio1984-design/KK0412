import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const updateData: Record<string, unknown> = {}
    if (body.checkOut) updateData.check_out_time = new Date().toISOString()
    const { error } = await supabase.from('seat_occupancy').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}
