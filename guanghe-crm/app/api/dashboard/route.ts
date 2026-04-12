import { prisma } from '@/lib/prisma'
import { getMonthRange, getOverdueDays } from '@/lib/utils'
import { NextResponse } from 'next/server'

// GET /api/dashboard
export async function GET() {
  try {
    const { start, end } = getMonthRange()

    const [activeCount, monthlyDueAgg, monthlyCollectedAgg, overduePayments] =
      await Promise.all([
        // 服務中客戶數
        prisma.spaceClient.count({ where: { stage: '服務中' } }),

        // 本月應收
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { dueDate: { gte: start, lte: end } },
        }),

        // 本月實收
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: '已收',
            paidAt: { gte: start, lte: end },
          },
        }),

        // 逾期未收清單
        prisma.payment.findMany({
          where: { status: '逾期' },
          include: {
            spaceClient: { include: { organization: true } },
          },
          orderBy: { dueDate: 'asc' },
        }),
      ])

    const monthlyDue = monthlyDueAgg._sum.amount ?? 0
    const monthlyCollected = monthlyCollectedAgg._sum.amount ?? 0

    const overdueList = overduePayments.map((p) => ({
      paymentId: p.id,
      orgName: p.spaceClient.organization.name,
      dueDate: p.dueDate.toISOString().split('T')[0],
      amount: p.amount,
      overdueDays: getOverdueDays(p.dueDate.toISOString()),
    }))

    return NextResponse.json({
      activeCount,
      monthlyDue,
      monthlyCollected,
      gap: monthlyDue - monthlyCollected,
      overdueList,
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: '載入儀表板失敗' }, { status: 500 })
  }
}
