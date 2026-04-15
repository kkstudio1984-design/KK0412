import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { title, category, tags, content } = body
    if (!title || !content) return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    const { data, error } = await supabase.from('knowledge_docs').insert({
      title,
      category: category || 'SOP流程',
      tags: tags || [],
      content,
      created_by: user?.id || null,
      updated_by: user?.id || null,
    }).select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '建立失敗' }, { status: 500 }) }
}
