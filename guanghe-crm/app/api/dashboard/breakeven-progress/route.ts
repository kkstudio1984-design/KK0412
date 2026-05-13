import { NextResponse } from 'next/server'
import { fetchBreakevenProgress } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await fetchBreakevenProgress()
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
