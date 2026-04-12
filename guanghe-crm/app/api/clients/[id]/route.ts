import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/clients/[id] — 完整資料（含 KYC + payments）
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await prisma.spaceClient.findUnique({
      where: { id },
      include: {
        organization: true,
        kycChecks: { orderBy: { checkedAt: 'asc' } },
        payments: { orderBy: { dueDate: 'asc' } },
      },
    })

    if (!client) {
      return NextResponse.json({ error: '找不到客戶' }, { status: 404 })
    }

    const result = {
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
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/clients/[id]]', error)
    return NextResponse.json({ error: '載入客戶失敗' }, { status: 500 })
  }
}

// PATCH /api/clients/[id] — 更新欄位（含 stage KYC 鎖定）
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    // KYC 鎖定規則（借址登記 → 已簽約 需全部通過）
    if (body.stage === '已簽約') {
      const client = await prisma.spaceClient.findUnique({
        where: { id },
        include: { kycChecks: true },
      })
      if (client?.serviceType === '借址登記') {
        const allPassed = client.kycChecks.every((k) => k.status === '通過')
        if (!allPassed) {
          return NextResponse.json(
            { error: 'KYC 尚未全部通過，無法推進到已簽約' },
            { status: 422 }
          )
        }
      }
    }

    const updated = await prisma.spaceClient.update({
      where: { id },
      data: {
        ...(body.stage !== undefined && { stage: body.stage }),
        ...(body.nextAction !== undefined && { nextAction: body.nextAction }),
        ...(body.followUpDate !== undefined && {
          followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        }),
        ...(body.redFlags !== undefined && { redFlags: body.redFlags }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.plan !== undefined && { plan: body.plan }),
        ...(body.monthlyFee !== undefined && { monthlyFee: parseInt(body.monthlyFee) }),
        // org fields
      },
      include: { organization: true },
    })

    // 更新 org 欄位（若有）
    if (body.orgName || body.contactName || body.contactPhone ||
        body.contactEmail || body.contactLine || body.taxId || body.source) {
      await prisma.organization.update({
        where: { id: updated.orgId },
        data: {
          ...(body.orgName && { name: body.orgName }),
          ...(body.contactName !== undefined && { contactName: body.contactName }),
          ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
          ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
          ...(body.contactLine !== undefined && { contactLine: body.contactLine }),
          ...(body.taxId !== undefined && { taxId: body.taxId }),
          ...(body.source !== undefined && { source: body.source }),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[PATCH /api/clients/[id]]', error)
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
