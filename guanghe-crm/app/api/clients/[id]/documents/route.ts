import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { docId, status } = body

    const updateData: Record<string, unknown> = { status }
    if (status === '已繳') {
      updateData.submitted_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('client_documents')
      .update(updateData)
      .eq('id', docId)
      .eq('space_client_id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/documents]', error)
    return NextResponse.json({ error: '更新文件失敗' }, { status: 500 })
  }
}
