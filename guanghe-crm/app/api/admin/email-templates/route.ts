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

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{[\w_]+\}\}/g) || []
  return Array.from(new Set(matches))
}

export async function GET() {
  const { error, status, supabase } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })
  try {
    const { data, error: err } = await supabase.from('email_templates').select('*').order('category').order('name')
    if (err) throw err
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: '載入失敗' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  const { error, status, supabase } = await requireAdmin()
  if (error) return NextResponse.json({ error }, { status })
  try {
    const body = await req.json()
    const { name, templateKey, category, subject, body: emailBody, description } = body
    if (!name || !templateKey || !subject || !emailBody) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }
    const variables = extractVariables(subject + ' ' + emailBody)
    const { data, error: err } = await supabase.from('email_templates').insert({
      name,
      template_key: templateKey,
      category: category || '通用',
      subject,
      body: emailBody,
      variables,
      description: description || null,
      is_active: true,
    }).select().single()
    if (err) throw err
    return NextResponse.json(data, { status: 201 })
  } catch { return NextResponse.json({ error: '建立失敗（可能 template_key 重複）' }, { status: 500 }) }
}
