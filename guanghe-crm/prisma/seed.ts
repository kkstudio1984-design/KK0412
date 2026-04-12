import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const KYC_TYPES = [
  '商工登記',
  '司法院裁判書',
  '動產擔保',
  'Google搜尋',
  '實質受益人審查',
] as const

async function main() {
  // 清除舊資料
  await prisma.payment.deleteMany()
  await prisma.kycCheck.deleteMany()
  await prisma.spaceClient.deleteMany()
  await prisma.organization.deleteMany()

  // ── 5 間組織 ──
  const orgs = await Promise.all([
    prisma.organization.create({
      data: { name: '陽光科技有限公司', taxId: '12345678', contactName: '王大明', contactPhone: '0912-345-678', source: 'BNI轉介' },
    }),
    prisma.organization.create({
      data: { name: '綠意設計工作室', contactName: '林小芳', contactPhone: '0923-456-789', source: '自來客' },
    }),
    prisma.organization.create({
      data: { name: '海洋貿易股份有限公司', taxId: '87654321', contactName: '張海洋', contactPhone: '0934-567-890', source: '記帳師轉介' },
    }),
    prisma.organization.create({
      data: { name: '山林文創有限公司', taxId: '11223344', contactName: '李山林', contactPhone: '0945-678-901', source: 'LINE表單' },
    }),
    prisma.organization.create({
      data: { name: '星辰管顧有限公司', taxId: '55667788', contactName: '陳星辰', contactPhone: '0956-789-012', source: '蒲公英' },
    }),
  ])

  // ── Client 1: 初步詢問（借址）— KYC 全部待查 ──
  const c1 = await prisma.spaceClient.create({
    data: {
      orgId: orgs[0].id,
      serviceType: '借址登記',
      plan: '標準方案',
      monthlyFee: 1500,
      stage: '初步詢問',
      followUpDate: new Date(Date.now() + 4 * 86400000),
      nextAction: '寄送方案介紹',
    },
  })
  await prisma.kycCheck.createMany({
    data: KYC_TYPES.map((checkType) => ({
      spaceClientId: c1.id,
      checkType,
      status: '待查' as const,
    })),
  })

  // ── Client 2: KYC審核中（借址）— 部分通過 ──
  const c2 = await prisma.spaceClient.create({
    data: {
      orgId: orgs[1].id,
      serviceType: '借址登記',
      plan: '身障優惠方案',
      monthlyFee: 800,
      stage: 'KYC審核中',
      followUpDate: new Date(Date.now() + 1 * 86400000),
      nextAction: '等待動產擔保查詢結果',
    },
  })
  await prisma.kycCheck.createMany({
    data: [
      { spaceClientId: c2.id, checkType: '商工登記',      status: '通過' },
      { spaceClientId: c2.id, checkType: '司法院裁判書',  status: '通過' },
      { spaceClientId: c2.id, checkType: '動產擔保',      status: '待查' },
      { spaceClientId: c2.id, checkType: 'Google搜尋',    status: '待查' },
      { spaceClientId: c2.id, checkType: '實質受益人審查', status: '待查' },
    ],
  })

  // ── Client 3: 服務中（借址）— KYC 全通過，有正常收款 ──
  const c3 = await prisma.spaceClient.create({
    data: {
      orgId: orgs[2].id,
      serviceType: '借址登記',
      plan: '標準方案',
      monthlyFee: 2500,
      stage: '服務中',
    },
  })
  await prisma.kycCheck.createMany({
    data: KYC_TYPES.map((checkType) => ({
      spaceClientId: c3.id,
      checkType,
      status: '通過' as const,
    })),
  })
  await prisma.payment.createMany({
    data: [
      { spaceClientId: c3.id, dueDate: new Date('2026-03-01'), amount: 2500, status: '已收', paidAt: new Date('2026-03-02') },
      { spaceClientId: c3.id, dueDate: new Date('2026-04-01'), amount: 2500, status: '已收', paidAt: new Date('2026-04-01') },
      { spaceClientId: c3.id, dueDate: new Date('2026-05-01'), amount: 2500, status: '未收' },
    ],
  })

  // ── Client 4: 服務中（共享工位）— 有逾期收款 + 紅旗 ──
  const c4 = await prisma.spaceClient.create({
    data: {
      orgId: orgs[3].id,
      serviceType: '共享工位',
      plan: '月租工位',
      monthlyFee: 4500,
      stage: '服務中',
      redFlags: ['曾拖欠款項'],
      followUpDate: new Date(Date.now() - 2 * 86400000),
    },
  })
  await prisma.payment.createMany({
    data: [
      { spaceClientId: c4.id, dueDate: new Date('2026-03-01'), amount: 4500, status: '已收', paidAt: new Date('2026-03-05') },
      { spaceClientId: c4.id, dueDate: new Date('2026-04-01'), amount: 4500, status: '逾期' },
    ],
  })

  // ── Client 5: 已流失（借址）──
  const c5 = await prisma.spaceClient.create({
    data: {
      orgId: orgs[4].id,
      serviceType: '借址登記',
      plan: '標準方案',
      monthlyFee: 1500,
      stage: '已流失',
      notes: '客戶找到其他地址服務',
    },
  })
  await prisma.kycCheck.createMany({
    data: KYC_TYPES.map((checkType) => ({
      spaceClientId: c5.id,
      checkType,
      status: '通過' as const,
    })),
  })

  console.log('✅ Seed data inserted:')
  console.log(`   5 organizations`)
  console.log(`   5 space clients`)
  console.log(`   KYC checks + payments`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
