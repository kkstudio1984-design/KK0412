import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: '無權限' }, { status: 403 })

    const body = await req.json()
    const { userId, role } = body

    if (!['admin', 'operator', 'viewer', 'partner'].includes(role)) {
      return NextResponse.json({ error: '無效的角色' }, { status: 400 })
    }

    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/admin/users]', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
