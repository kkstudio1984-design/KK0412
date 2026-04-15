import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('email_templates').select('*').eq('is_active', true).order('category').order('name')
    if (error) throw error
    return NextResponse.json(data)
  } catch { return NextResponse.json({ error: '載入失敗' }, { status: 500 }) }
}
