import { prisma } from './prisma'
import { ClientWithOrg, ClientDetail, DashboardData } from './types'
import { getMonthRange, getOverdueDays } from './utils'

export async function fetchClients(): Promise<ClientWithOrg[]> {
  const clients = await prisma.spaceClient.findMany({
    include: {
      organization: true,
      kycChecks: true,
      payments: { select: { status: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return clients.map((c) => ({
    ...c,
    followUpDate: c.followUpDate?.toISOString().split('T')[0] ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    organization: {
      ...c.organization,
      createdAt: c.organization.createdAt.toISOString(),
      updatedAt: c.organization.updatedAt.toISOString(),
    },
    kycChecks: c.kycChecks.map((k) => ({
      ...k,
      checkedAt: k.checkedAt.toISOString(),
    })),
    hasOverduePayment: c.payments.some((p) => p.status === '逾期'),
    payments: undefined,
  })) as ClientWithOrg[]
}

export async function fetchClient(id: string): Promise<ClientDetail | null> {
  const client = await prisma.spaceClient.findUnique({
    where: { id },
    include: {
      organization: true,
      kycChecks: { orderBy: { checkedAt: 'asc' } },
      payments: { orderBy: { dueDate: 'asc' } },
    },
  })

  if (!client) return null

  return {
    ...client,
    followUpDate: client.followUpDate?.toISOString().split('T')[0] ?? null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
    organization: {
      ...client.organization,
      createdAt: client.organization.createdAt.toISOString(),
      updatedAt: client.organization.updatedAt.toISOString(),
    },
    kycChecks: client.kycChecks.map((k) => ({
      ...k,
      checkedAt: k.checkedAt.toISOString(),
    })),
    payments: client.payments.map((p) => ({
      ...p,
      dueDate: p.dueDate.toISOString().split('T')[0],
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
  } as ClientDetail
}

export async function fetchDashboard(): Promise<DashboardData> {
  const { start, end } = getMonthRange()

  const [activeCount, monthlyDueAgg, monthlyCollectedAgg, overduePayments] =
    await Promise.all([
      prisma.spaceClient.count({ where: { stage: '服務中' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { dueDate: { gte: start, lte: end } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: '已收', paidAt: { gte: start, lte: end } },
      }),
      prisma.payment.findMany({
        where: { status: '逾期' },
        include: { spaceClient: { include: { organization: true } } },
        orderBy: { dueDate: 'asc' },
      }),
    ])

  const monthlyDue = monthlyDueAgg._sum.amount ?? 0
  const monthlyCollected = monthlyCollectedAgg._sum.amount ?? 0

  return {
    activeCount,
    monthlyDue,
    monthlyCollected,
    gap: monthlyDue - monthlyCollected,
    overdueList: overduePayments.map((p) => ({
      paymentId: p.id,
      orgName: p.spaceClient.organization.name,
      dueDate: p.dueDate.toISOString().split('T')[0],
      amount: p.amount,
      overdueDays: getOverdueDays(p.dueDate.toISOString()),
    })),
  }
}
