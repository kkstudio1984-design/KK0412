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

// Cancel a pending signing request: invalidate the token and reset status to 未發送
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    // Only allow cancel if currently 待簽署 (cannot cancel after signing/rejecting)
    const { data: existing, error: fetchError } = await supabase
      .from('contracts')
      .select('signing_status')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: '合約不存在' }, { status: 404 })
    }
    if (existing.signing_status !== '待簽署') {
      return NextResponse.json(
        { error: `無法取消：目前狀態為「${existing.signing_status}」` },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('contracts')
      .update({
        signing_token: null,
        signing_token_expires_at: null,
        signing_status: '未發送',
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '取消簽署失敗', details: String(error) }, { status: 500 })
  }
}
