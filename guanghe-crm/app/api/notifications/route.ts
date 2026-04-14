import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: '載入通知失敗' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    if (body.markAllRead) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })
      await supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .eq('read', false)
    } else if (body.id) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', body.id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
