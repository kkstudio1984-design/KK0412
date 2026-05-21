// POST /api/kyc/auto-check/[spaceClientId]
// 對 space_client 跑自動 KYC（商工登記等），結果寫進 kyc_checks 表、回傳摘要。
//
// 安全：要求 authenticated + admin/operator role。

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { runAutoKyc } from '@/lib/kyc-auto'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ spaceClientId: string }> }
) {
  const { spaceClientId } = await params
  const supabase = await createClient()

  // 1. 身份驗證
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'operator'].includes(profile.role)) {
    return NextResponse.json({ error: 'forbidden: admin/operator only' }, { status: 403 })
  }

  // 2. 抓 space_client 對應的 organization tax_id
  const { data: client, error: fetchError } = await supabase
    .from('space_clients')
    .select(`
      id,
      organization:organizations(tax_id, name)
    `)
    .eq('id', spaceClientId)
    .single()

  if (fetchError || !client) {
    return NextResponse.json({ error: 'space_client not found' }, { status: 404 })
  }

  const org = (client as { organization?: { tax_id?: string; name?: string } }).organization
  const taxId = org?.tax_id

  if (!taxId) {
    return NextResponse.json({ error: 'organization has no tax_id; cannot auto-check 商工登記' }, { status: 422 })
  }

  // 3. 跑自動 KYC
  try {
    const result = await runAutoKyc({ spaceClientId, taxId, supabase })
    return NextResponse.json({ ok: true, ...result })
  } catch (e: unknown) {
    console.error('[kyc-auto] failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    )
  }
}
