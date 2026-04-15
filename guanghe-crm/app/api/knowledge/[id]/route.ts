import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const updateData: Record<string, unknown> = { updated_by: user?.id || null }
    if (body.title !== undefined) updateData.title = body.title
    if (body.category !== undefined) updateData.category = body.category
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.content !== undefined) updateData.content = body.content
    if (body.isPinned !== undefined) updateData.is_pinned = body.isPinned
    const { error } = await supabase.from('knowledge_docs').update(updateData).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: '僅限管理員' }, { status: 403 })
    const { error } = await supabase.from('knowledge_docs').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }) }
}
