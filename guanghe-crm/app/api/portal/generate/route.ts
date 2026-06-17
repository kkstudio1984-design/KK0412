// POST /api/portal/generate
// Admin-only endpoint：為 space_client 產生 portal magic link token、回傳 URL。
// 對應 admin UI /admin/portal-tokens 的 generate form。

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePortalToken } from '@/lib/portal-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RequestBody {
  spaceClientId: string
  ttlDays?: number
  notes?: string
}

export async function POST(req: NextRequest) {
  // ── Auth: 只有 admin / operator 可以產 token ──────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'operator'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ───────────────────────────────────────
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.spaceClientId || typeof body.spaceClientId !== 'string') {
    return NextResponse.json({ error: 'spaceClientId required' }, { status: 400 })
  }

  // Validate ttlDays: 1-365 days
  const ttlDays = body.ttlDays ?? 30
  if (!Number.isInteger(ttlDays) || ttlDays < 1 || ttlDays > 365) {
    return NextResponse.json({ error: 'ttlDays must be integer 1-365' }, { status: 400 })
  }

  // ── Generate token ───────────────────────────────────
  try {
    const result = await generatePortalToken({
      spaceClientId: body.spaceClientId,
      ttlDays,
      notes: body.notes?.slice(0, 200) || undefined, // cap notes length
      createdBy: user.id,
      supabase,
    })

    return NextResponse.json({
      token: result.token,
      url: result.url,
      expiresAt: result.expiresAt,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
