import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients/[id]/payments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payments = await prisma.payment.findMany({
      where: { spaceClientId: id },
      orderBy: { dueDate: 'asc' },
    })

    const result = payments.map((p: any) => ({
      ...p,
      dueDate: p.dueDate.toISOString().split('T')[0],
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/clients/[id]/payments]', error)
    return NextResponse.json({ error: '載入收款紀錄失敗' }, { status: 500 })
  }
}

// POST /api/clients/[id]/payments — 新增收款
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { dueDate, amount } = await req.json()

    if (!dueDate || !amount) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        spaceClientId: id,
        dueDate: new Date(dueDate),
        amount: parseInt(amount),
        status: '未收',
      },
    })

    return NextResponse.json({
      ...payment,
      dueDate: payment.dueDate.toISOString().split('T')[0],
      paidAt: null,
      createdAt: payment.createdAt.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients/[id]/payments]', error)
    return NextResponse.json({ error: '新增收款失敗' }, { status: 500 })
  }
}
