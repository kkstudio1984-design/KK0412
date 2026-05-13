import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchStudents } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const STATUS_VALUES = ['培訓中', '實習中', '執業中', '暫停中', '離開'] as const

export async function GET() {
  try {
    const students = await fetchStudents()
    return NextResponse.json({ students })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/students — 極簡新增（不含 consent 欄位，授權須走獨立流程）
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await req.json()

    const {
      code,
      displayName,
      realName,
      age,
      gender,
      cohort,
      disabilityType,
      disabilityLevel,
      joinedAt,
      stipendMonthly,
      status,
    } = body

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: '請填寫學員代碼' }, { status: 400 })
    }
    if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
      return NextResponse.json({ error: '請填寫對外稱呼' }, { status: 400 })
    }

    const safeStatus = (STATUS_VALUES as readonly string[]).includes(status)
      ? status
      : '培訓中'

    const parsedAge =
      age === undefined || age === null || age === ''
        ? null
        : Number.isFinite(Number(age))
        ? parseInt(String(age))
        : null

    const parsedStipend =
      stipendMonthly === undefined || stipendMonthly === null || stipendMonthly === ''
        ? 0
        : Number.isFinite(Number(stipendMonthly))
        ? parseInt(String(stipendMonthly))
        : 0

    const insertPayload: Record<string, unknown> = {
      code: code.trim(),
      display_name: displayName.trim(),
      status: safeStatus,
      stipend_monthly: parsedStipend,
    }
    if (realName && String(realName).trim()) insertPayload.real_name = String(realName).trim()
    if (parsedAge !== null) insertPayload.age = parsedAge
    if (gender && String(gender).trim()) insertPayload.gender = String(gender).trim()
    if (cohort && String(cohort).trim()) insertPayload.cohort = String(cohort).trim()
    if (disabilityType && String(disabilityType).trim())
      insertPayload.disability_type = String(disabilityType).trim()
    if (disabilityLevel && String(disabilityLevel).trim())
      insertPayload.disability_level = String(disabilityLevel).trim()
    if (joinedAt) insertPayload.joined_at = joinedAt

    const { data: student, error } = await supabase
      .from('students')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '學員代碼已存在，請換一個' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ student }, { status: 201 })
  } catch (e: unknown) {
    console.error('[POST /api/students]', e)
    const msg = e instanceof Error ? e.message : '新增學員失敗'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
