import { prisma } from '@/lib/prisma'
import { KYC_CHECK_TYPES } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients — 看板用，含 hasOverduePayment
export async function GET() {
  try {
    const clients = await prisma.spaceClient.findMany({
      include: {
        organization: true,
        kycChecks: true,
        payments: { select: { status: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const result = clients.map((c: any) => ({
      ...c,
      followUpDate: c.followUpDate?.toISOString().split('T')[0] ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      organization: {
        ...c.organization,
        createdAt: c.organization.createdAt.toISOString(),
        updatedAt: c.organization.updatedAt.toISOString(),
      },
      kycChecks: c.kycChecks.map((k: any) => ({
        ...k,
        checkedAt: k.checkedAt.toISOString(),
      })),
      hasOverduePayment: c.payments.some((p: any) => p.status === '逾期'),
      payments: undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/clients]', error)
    return NextResponse.json({ error: '載入客戶失敗' }, { status: 500 })
  }
}

// POST /api/clients — 建立 org + space_client (+ KYC if 借址)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, taxId, contactName, contactPhone, contactEmail, contactLine, source, orgNotes,
      serviceType, plan, monthlyFee, notes,
    } = body

    if (!name || !contactName || !serviceType) {
      return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, taxId, contactName, contactPhone, contactEmail, contactLine, source, notes: orgNotes },
      })

      const client = await tx.spaceClient.create({
        data: {
          orgId: org.id,
          serviceType,
          plan,
          monthlyFee: monthlyFee ? parseInt(monthlyFee) : 0,
          stage: '初步詢問',
          notes,
        },
      })

      if (serviceType === '借址登記') {
        await tx.kycCheck.createMany({
          data: KYC_CHECK_TYPES.map((checkType) => ({
            spaceClientId: client.id,
            checkType,
            status: '待查' as const,
          })),
        })
      }

      return { org, client }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients]', error)
    return NextResponse.json({ error: '新增客戶失敗' }, { status: 500 })
  }
}
