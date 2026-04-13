import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/clients/[id]/kyc — 更新單筆 KYC 狀態
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()
    const { kycId, checkId, status, overrideReason } = body
    const resolvedId = kycId || checkId

    const updateData: Record<string, unknown> = {
      status,
      checked_at: new Date().toISOString(),
    }
    if (overrideReason) {
      updateData.override_reason = overrideReason
    }

    const { error } = await supabase
      .from('kyc_checks')
      .update(updateData)
      .eq('id', resolvedId)
      .eq('space_client_id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/kyc]', error)
    return NextResponse.json({ error: '更新 KYC 失敗' }, { status: 500 })
  }
}
