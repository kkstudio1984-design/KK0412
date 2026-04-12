import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// PATCH /api/clients/[id]/payments/[pid] — 切換收款狀態
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pid: string }> }
) {
  try {
    const { id, pid } = await params
    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ error: '缺少 status' }, { status: 400 })
    }

    const updated = await prisma.payment.update({
      where: { id: pid, spaceClientId: id },
      data: {
        status,
        paidAt: status === '已收' ? new Date() : null,
      },
    })

    return NextResponse.json({
      ...updated,
      dueDate: updated.dueDate.toISOString().split('T')[0],
      paidAt: updated.paidAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]/payments/[pid]]', error)
    return NextResponse.json({ error: '更新收款失敗' }, { status: 500 })
  }
}
