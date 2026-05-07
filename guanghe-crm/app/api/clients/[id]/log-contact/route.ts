// ── 紀錄主動聯繫客戶 ───────────────────────────────────────
// POST body: { note?: string }
// 寫 last_contacted_at = now()，同時可選帶一段 note。
// 受 middleware 保護（必須登入後台），無需額外 RLS。

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : null

    const supabase = await createClient()
    const { error } = await supabase
      .from('space_clients')
      .update({
        last_contacted_at: new Date().toISOString(),
        last_contacted_note: note,
      })
      .eq('id', id)

    if (error) {
      // 欄位不存在時給友善提示，提醒先跑 migration 021
      const msg = error.message || ''
      if (/does not exist|column.*last_contacted/i.test(msg)) {
        return NextResponse.json(
          { error: '尚未跑 migration 021_last_contacted，請到 Supabase SQL Editor 執行後再試。' },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ ok: true, contactedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
