import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '未登入', status: 401, supabase }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: '無權限', status: 403, supabase }
  return { supabase, user }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, status, supabase } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })
  try {
    const body = await req.json()
    const updateData: Record<string, unknown> = {}
    if (body.subject !== undefined) updateData.subject = body.subject
    if (body.body !== undefined) updateData.body = body.body
    if (body.description !== undefined) updateData.description = body.description
    if (body.variables !== undefined) updateData.variables = body.variables
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.name !== undefined) updateData.name = body.name
    if (body.category !== undefined) updateData.category = body.category
    const { error: err } = await supabase.from('email_templates').update(updateData).eq('id', id)
    if (err) throw err
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '更新失敗' }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error, status, supabase } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })
  try {
    const { error: err } = await supabase.from('email_templates').delete().eq('id', id)
    if (err) throw err
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: '刪除失敗' }, { status: 500 }) }
}
