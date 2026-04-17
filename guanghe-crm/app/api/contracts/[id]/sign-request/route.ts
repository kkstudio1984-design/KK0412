import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { addHours } from 'date-fns'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const token = randomUUID()
    const expiresAt = addHours(new Date(), 72).toISOString()

    const { error } = await supabase
      .from('contracts')
      .update({
        signing_token: token,
        signing_token_expires_at: expiresAt,
        signing_status: '待簽署',
      })
      .eq('id', id)

    if (error) throw error

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const signingUrl = `${baseUrl}/sign/${token}`

    return NextResponse.json({ ok: true, signingUrl, expiresAt })
  } catch (error) {
    return NextResponse.json({ error: '產生簽署連結失敗', details: String(error) }, { status: 500 })
  }
}
