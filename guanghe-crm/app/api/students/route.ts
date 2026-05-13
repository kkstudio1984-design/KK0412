import { NextResponse } from 'next/server'
import { fetchStudents } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const students = await fetchStudents()
    return NextResponse.json({ students })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
