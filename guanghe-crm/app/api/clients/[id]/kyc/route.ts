import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/clients/[id]/kyc — 更新單筆 KYC 狀態
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { kycId, status } = await req.json()

    if (!kycId || !status) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    await prisma.kycCheck.update({
      where: { id: kycId, spaceClientId: id },
      data: { status, checkedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/kyc]', error)
    return NextResponse.json({ error: '更新 KYC 失敗' }, { status: 500 })
  }
}
