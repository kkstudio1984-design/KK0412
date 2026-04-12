# SDD｜光合創學空間營運 CRM — Software Design Document

---

## 1. SYSTEM OVERVIEW

| 項目 | 內容 |
|------|------|
| 系統名稱 | 光合創學空間營運 CRM |
| 文件版本 | v1.0 |
| 對應 PRD | PRD v1.0（極簡驗收版） |
| Tech Stack | Next.js 14 (App Router) + PostgreSQL (local) + Prisma + Tailwind CSS |
| 部署環境 | 本機開發 / 可選部署至 VPS |
| 認證系統 | 無（本版跳過） |

---

## 2. TECH STACK DECISIONS

### 2-1 原 Supabase → 本地 PostgreSQL 差異對照

| 層面 | PRD 原方案 | 本 SDD 方案 |
|------|-----------|-----------|
| 資料庫 | Supabase hosted PostgreSQL | 本機 PostgreSQL 16+ |
| DB Client | `@supabase/supabase-js` | Prisma ORM |
| 資料庫 URL | Supabase Dashboard 取得 | `postgresql://USER:PASS@localhost:5432/guanghe_crm` |
| RLS | Supabase RLS Policy | 不需要（無 Auth） |
| Realtime | Supabase Realtime | 不做（簡化版） |
| 部署 | Vercel | 本機 `next dev` / 可選 VPS |

### 2-2 完整依賴清單

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@prisma/client": "^5.x",
    "@hello-pangea/dnd": "^16.x",
    "react-hot-toast": "^2.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "tailwindcss": "^3.x",
    "postcss": "^8.x",
    "autoprefixer": "^10.x"
  }
}
```

---

## 3. DATABASE DESIGN

### 3-1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id            String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name          String
  taxId         String?        @map("tax_id")
  contactName   String         @map("contact_name")
  contactPhone  String?        @map("contact_phone")
  contactEmail  String?        @map("contact_email")
  contactLine   String?        @map("contact_line")
  source        Source         @default(自來客)
  notes         String?
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  spaceClients  SpaceClient[]

  @@map("organizations")
}

model SpaceClient {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId         String       @map("org_id") @db.Uuid
  serviceType   ServiceType  @map("service_type")
  plan          String?
  monthlyFee    Int          @default(0) @map("monthly_fee")
  stage         Stage        @default(初步詢問)
  nextAction    String?      @map("next_action")
  followUpDate  DateTime?    @map("follow_up_date") @db.Date
  redFlags      String[]     @default([]) @map("red_flags")
  notes         String?
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  kycChecks     KycCheck[]
  payments      Payment[]

  @@map("space_clients")
}

model KycCheck {
  id            String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  spaceClientId String      @map("space_client_id") @db.Uuid
  checkType     CheckType   @map("check_type")
  status        KycStatus   @default(待查)
  checkedAt     DateTime    @default(now()) @map("checked_at")
  spaceClient   SpaceClient @relation(fields: [spaceClientId], references: [id], onDelete: Cascade)

  @@map("kyc_checks")
}

model Payment {
  id            String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  spaceClientId String        @map("space_client_id") @db.Uuid
  dueDate       DateTime      @map("due_date") @db.Date
  amount        Int
  status        PaymentStatus @default(未收)
  paidAt        DateTime?     @map("paid_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  spaceClient   SpaceClient   @relation(fields: [spaceClientId], references: [id], onDelete: Cascade)

  @@map("payments")
}

enum Source {
  LINE表單
  BNI轉介
  記帳師轉介
  蒲公英
  ESG
  自來客
  其他
}

enum ServiceType {
  借址登記
  共享工位
  場地租借
}

enum Stage {
  初步詢問
  KYC審核中
  已簽約
  服務中
  退租中
  已結案
  已流失
}

enum CheckType {
  商工登記
  司法院裁判書
  動產擔保
  Google搜尋
  實質受益人審查
}

enum KycStatus {
  通過
  異常
  待查
}

enum PaymentStatus {
  已收
  未收
  逾期
}
```

### 3-2 資料庫初始化指令

```bash
# 1. 建立本地資料庫
createdb guanghe_crm

# 2. 設定環境變數
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/guanghe_crm"' > .env.local

# 3. 執行 migration
npx prisma migrate dev --name init

# 4. 插入 Seed Data
npx prisma db seed
```

### 3-3 ER Diagram（關聯摘要）

```
organizations (1)
    └── space_clients (N)
            ├── kyc_checks (5 筆，僅借址登記)
            └── payments (N 筆)
```

---

## 4. FILE STRUCTURE

```
guanghe-crm/
├── app/
│   ├── layout.tsx                  # Root layout（含側邊導覽列）
│   ├── page.tsx                    # CRM 看板（首頁）
│   ├── dashboard/
│   │   └── page.tsx                # 儀表板
│   └── clients/
│       ├── new/
│       │   └── page.tsx            # 新增客戶表單
│       └── [id]/
│           └── page.tsx            # 客戶詳情
│
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx         # 看板主體（DnD context）
│   │   ├── KanbanColumn.tsx        # 單一階段欄位
│   │   └── ClientCard.tsx          # 客戶卡片
│   ├── clients/
│   │   ├── ClientForm.tsx          # 新增客戶表單
│   │   ├── ClientInfo.tsx          # 基本資料區塊（可編輯）
│   │   ├── KycChecks.tsx           # KYC 查核區塊
│   │   └── PaymentList.tsx         # 收款紀錄區塊
│   ├── dashboard/
│   │   ├── MetricCard.tsx          # 數字卡片
│   │   └── OverdueTable.tsx        # 逾期清單
│   └── ui/
│       ├── Skeleton.tsx            # Loading skeleton
│       └── Badge.tsx               # 狀態標籤（通過/異常/待查等）
│
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── types.ts                    # TypeScript 型別定義
│   └── utils.ts                    # 工具函式（日期計算、顏色判斷）
│
├── app/api/
│   ├── clients/
│   │   ├── route.ts                # GET /api/clients, POST /api/clients
│   │   └── [id]/
│   │       ├── route.ts            # GET, PATCH /api/clients/[id]
│   │       ├── kyc/
│   │       │   └── route.ts        # PATCH /api/clients/[id]/kyc
│   │       └── payments/
│   │           └── route.ts        # GET, POST, PATCH /api/clients/[id]/payments
│   └── dashboard/
│       └── route.ts                # GET /api/dashboard（統計資料）
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                     # Seed data
│
├── .env.local                      # DATABASE_URL（不進 git）
├── .env.example                    # 範例環境變數
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. API ROUTES

### 5-1 總覽

| Method | Route | 功能 |
|--------|-------|------|
| GET | `/api/clients` | 取得所有客戶（含 organization 資料），用於看板 |
| POST | `/api/clients` | 建立 organization + space_client（+ 自動建 KYC） |
| GET | `/api/clients/[id]` | 取得單一客戶完整資料（含 KYC + payments） |
| PATCH | `/api/clients/[id]` | 更新客戶資料（含 stage 拖拉更新） |
| PATCH | `/api/clients/[id]/kyc` | 批次更新 KYC 狀態 |
| GET | `/api/clients/[id]/payments` | 取得收款列表 |
| POST | `/api/clients/[id]/payments` | 新增收款紀錄 |
| PATCH | `/api/clients/[id]/payments/[pid]` | 更新收款狀態 |
| GET | `/api/dashboard` | 取得儀表板統計數據 |

### 5-2 關鍵 API 實作說明

#### POST `/api/clients` — 新增客戶（含自動建 KYC）

```typescript
// 使用 Prisma transaction 確保 atomicity
const result = await prisma.$transaction(async (tx) => {
  const org = await tx.organization.create({ data: orgData })

  const client = await tx.spaceClient.create({
    data: { ...clientData, orgId: org.id, stage: '初步詢問' }
  })

  if (client.serviceType === '借址登記') {
    const KYC_TYPES = ['商工登記', '司法院裁判書', '動產擔保', 'Google搜尋', '實質受益人審查']
    await tx.kycCheck.createMany({
      data: KYC_TYPES.map(checkType => ({
        spaceClientId: client.id,
        checkType,
        status: '待查'
      }))
    })
  }

  return { org, client }
})
```

#### PATCH `/api/clients/[id]` — 更新 stage（含 KYC 鎖定規則）

```typescript
// 伺服器端執行 KYC 鎖定規則（不只依賴前端）
if (body.stage === '已簽約') {
  const client = await prisma.spaceClient.findUnique({
    where: { id },
    include: { kycChecks: true }
  })

  if (client?.serviceType === '借址登記') {
    const allPassed = client.kycChecks.every(k => k.status === '通過')
    if (!allPassed) {
      return NextResponse.json(
        { error: 'KYC 尚未全部通過，無法推進到已簽約' },
        { status: 422 }
      )
    }
  }
}
```

#### PATCH `/api/clients/[id]/payments/[pid]` — 切換收款狀態

```typescript
// 切換為「已收」時自動填入 paid_at
const data: Prisma.PaymentUpdateInput = { status: body.status }
if (body.status === '已收') {
  data.paidAt = new Date()
} else {
  data.paidAt = null  // 取消已收時清空
}
```

---

## 6. COMPONENT DESIGN

### 6-1 KanbanBoard（看板主體）

```typescript
// 資料流
// page.tsx → fetch /api/clients → 按 stage 分組 → 傳入 KanbanBoard

// DnD 核心邏輯（@hello-pangea/dnd）
const onDragEnd = async (result: DropResult) => {
  if (!result.destination) return
  const newStage = result.destination.droppableId as Stage

  // 前端先做 KYC 檢查（快速 UI 回饋）
  const client = findClient(result.draggableId)
  if (newStage === '已簽約' && client.serviceType === '借址登記') {
    const allPassed = client.kycChecks?.every(k => k.status === '通過')
    if (!allPassed) {
      toast.error('KYC 尚未全部通過，無法推進到已簽約')
      return
    }
  }

  // Optimistic update（先更新 UI）
  updateLocalState(result.draggableId, newStage)

  // 再打 API 確認
  const res = await fetch(`/api/clients/${result.draggableId}`, {
    method: 'PATCH',
    body: JSON.stringify({ stage: newStage })
  })

  if (!res.ok) {
    // 若 API 回錯（例如 KYC 鎖定），rollback UI
    rollbackLocalState()
    const { error } = await res.json()
    toast.error(error)
  }
}
```

### 6-2 ClientCard（客戶卡片）

顯示邏輯：

```typescript
// 跟進日期顏色
function getFollowUpColor(date: Date | null): string {
  if (!date) return 'text-gray-400'
  const daysLeft = differenceInDays(date, new Date())
  if (daysLeft >= 3) return 'text-green-600'
  if (daysLeft >= 1) return 'text-yellow-500'
  return 'text-red-600'
}

// 卡片顯示欄位
// - 紅旗（red_flags 非空 → 紅色標記，hover tooltip）
// - 公司名稱（org.name）
// - 聯絡人（org.contactName）
// - 服務類型（client.serviceType）
// - 跟進日期（client.followUpDate，含顏色）
// - 月費（client.monthlyFee）
// - 逾期收款標記（payments 中有 status='逾期'）
```

### 6-3 KycChecks（KYC 區塊）

```typescript
// 每個 check_type 一行，select 切換狀態
// 切換後立即 PATCH /api/clients/[id]/kyc
// 顯示進度：X/5 通過

const statusIcon = { '通過': '✅', '異常': '❌', '待查': '⏳' }
```

### 6-4 PaymentList（收款區塊）

```typescript
// 狀態顏色
const paymentColor = { '已收': 'text-green-600', '逾期': 'text-red-600', '未收': 'text-gray-400' }

// + 新增收款 → Modal（due_date, amount 兩個欄位）
// 點狀態 → inline toggle（已收 / 未收 / 逾期）
```

---

## 7. TYPE DEFINITIONS

```typescript
// lib/types.ts

export type Stage =
  | '初步詢問' | 'KYC審核中' | '已簽約'
  | '服務中' | '退租中' | '已結案' | '已流失'

export type ServiceType = '借址登記' | '共享工位' | '場地租借'

export type Source =
  | 'LINE表單' | 'BNI轉介' | '記帳師轉介'
  | '蒲公英' | 'ESG' | '自來客' | '其他'

export type CheckType =
  | '商工登記' | '司法院裁判書' | '動產擔保'
  | 'Google搜尋' | '實質受益人審查'

export type KycStatus = '通過' | '異常' | '待查'
export type PaymentStatus = '已收' | '未收' | '逾期'

// API 回傳型別（含 join 資料）
export type ClientWithOrg = {
  id: string
  orgId: string
  serviceType: ServiceType
  plan: string | null
  monthlyFee: number
  stage: Stage
  nextAction: string | null
  followUpDate: string | null
  redFlags: string[]
  notes: string | null
  organization: {
    id: string
    name: string
    contactName: string
    contactPhone: string | null
    contactEmail: string | null
    contactLine: string | null
    source: Source
  }
  kycChecks?: KycCheck[]
  payments?: Payment[]
  hasOverduePayment?: boolean  // 計算欄位（看板用）
}

export type KycCheck = {
  id: string
  spaceClientId: string
  checkType: CheckType
  status: KycStatus
  checkedAt: string
}

export type Payment = {
  id: string
  spaceClientId: string
  dueDate: string
  amount: number
  status: PaymentStatus
  paidAt: string | null
  createdAt: string
}

export type DashboardData = {
  activeCount: number       // 服務中客戶數
  monthlyDue: number        // 本月應收
  monthlyCollected: number  // 本月實收
  gap: number               // 缺口
  overdueList: OverdueItem[]
}

export type OverdueItem = {
  orgName: string
  dueDate: string
  amount: number
  overdueDays: number
}
```

---

## 8. UTILITY FUNCTIONS

```typescript
// lib/utils.ts

import { differenceInDays, startOfMonth, endOfMonth, format } from 'date-fns'

// 跟進日期顏色判斷
export function getFollowUpColor(dateStr: string | null): string {
  if (!dateStr) return 'text-gray-400'
  const days = differenceInDays(new Date(dateStr), new Date())
  if (days >= 3) return 'text-green-600'
  if (days >= 1) return 'text-yellow-500'
  return 'text-red-600'
}

// 跟進日期顯示文字
export function getFollowUpLabel(dateStr: string | null): string {
  if (!dateStr) return '未設定'
  const days = differenceInDays(new Date(dateStr), new Date())
  if (days > 0) return `${days} 天後`
  if (days === 0) return '今天'
  return `逾期 ${Math.abs(days)} 天`
}

// 本月起訖日（用於 dashboard query）
export function getMonthRange() {
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

// 金額格式化
export function formatNTD(amount: number): string {
  return `NT$${amount.toLocaleString('zh-TW')}`
}

// 逾期天數計算
export function getOverdueDays(dueDateStr: string): number {
  return Math.max(0, differenceInDays(new Date(), new Date(dueDateStr)))
}
```

---

## 9. PRISMA CLIENT SINGLETON

```typescript
// lib/prisma.ts
// Next.js 開發模式下防止 hot-reload 建立多個連線

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## 10. SEED DATA

```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const KYC_TYPES = ['商工登記', '司法院裁判書', '動產擔保', 'Google搜尋', '實質受益人審查'] as const

async function main() {
  // --- 5 間組織 ---
  const orgs = await Promise.all([
    prisma.organization.create({ data: { name: '陽光科技有限公司', taxId: '12345678', contactName: '王大明', contactPhone: '0912-345-678', source: 'BNI轉介' } }),
    prisma.organization.create({ data: { name: '綠意設計工作室', contactName: '林小芳', contactPhone: '0923-456-789', source: '自來客' } }),
    prisma.organization.create({ data: { name: '海洋貿易股份有限公司', taxId: '87654321', contactName: '張海洋', contactPhone: '0934-567-890', source: '記帳師轉介' } }),
    prisma.organization.create({ data: { name: '山林文創有限公司', taxId: '11223344', contactName: '李山林', contactPhone: '0945-678-901', source: 'LINE表單' } }),
    prisma.organization.create({ data: { name: '星辰管顧有限公司', taxId: '55667788', contactName: '陳星辰', contactPhone: '0956-789-012', source: '蒲公英' } }),
  ])

  // Client 1: 初步詢問（借址）— KYC 全部待查
  const c1 = await prisma.spaceClient.create({
    data: { orgId: orgs[0].id, serviceType: '借址登記', plan: '標準方案', monthlyFee: 1500, stage: '初步詢問', followUpDate: new Date(Date.now() + 3 * 86400000) }
  })
  await prisma.kycCheck.createMany({ data: KYC_TYPES.map(t => ({ spaceClientId: c1.id, checkType: t, status: '待查' })) })

  // Client 2: KYC審核中（借址）— 部分通過
  const c2 = await prisma.spaceClient.create({
    data: { orgId: orgs[1].id, serviceType: '借址登記', plan: '身障優惠方案', monthlyFee: 800, stage: 'KYC審核中', followUpDate: new Date(Date.now() + 1 * 86400000) }
  })
  await prisma.kycCheck.createMany({ data: [
    { spaceClientId: c2.id, checkType: '商工登記', status: '通過' },
    { spaceClientId: c2.id, checkType: '司法院裁判書', status: '通過' },
    { spaceClientId: c2.id, checkType: '動產擔保', status: '待查' },
    { spaceClientId: c2.id, checkType: 'Google搜尋', status: '待查' },
    { spaceClientId: c2.id, checkType: '實質受益人審查', status: '待查' },
  ]})

  // Client 3: 服務中（借址）— KYC 全通過，有正常收款
  const c3 = await prisma.spaceClient.create({
    data: { orgId: orgs[2].id, serviceType: '借址登記', plan: '標準方案', monthlyFee: 2500, stage: '服務中' }
  })
  await prisma.kycCheck.createMany({ data: KYC_TYPES.map(t => ({ spaceClientId: c3.id, checkType: t, status: '通過' })) })
  await prisma.payment.createMany({ data: [
    { spaceClientId: c3.id, dueDate: new Date('2026-03-01'), amount: 2500, status: '已收', paidAt: new Date('2026-03-02') },
    { spaceClientId: c3.id, dueDate: new Date('2026-04-01'), amount: 2500, status: '已收', paidAt: new Date('2026-04-01') },
    { spaceClientId: c3.id, dueDate: new Date('2026-05-01'), amount: 2500, status: '未收' },
  ]})

  // Client 4: 服務中（共享工位）— 有逾期收款
  const c4 = await prisma.spaceClient.create({
    data: { orgId: orgs[3].id, serviceType: '共享工位', plan: '月租工位', monthlyFee: 4500, stage: '服務中', redFlags: ['曾拖欠款項'] }
  })
  await prisma.payment.createMany({ data: [
    { spaceClientId: c4.id, dueDate: new Date('2026-03-01'), amount: 4500, status: '已收', paidAt: new Date('2026-03-05') },
    { spaceClientId: c4.id, dueDate: new Date('2026-04-01'), amount: 4500, status: '逾期' },
  ]})

  // Client 5: 已流失（借址）
  const c5 = await prisma.spaceClient.create({
    data: { orgId: orgs[4].id, serviceType: '借址登記', plan: '標準方案', monthlyFee: 1500, stage: '已流失', notes: '客戶找到其他地址服務' }
  })
  await prisma.kycCheck.createMany({ data: KYC_TYPES.map(t => ({ spaceClientId: c5.id, checkType: t, status: '通過' })) })

  console.log('Seed data inserted successfully.')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

---

## 11. ENVIRONMENT SETUP

```bash
# .env.example
DATABASE_URL="postgresql://postgres:password@localhost:5432/guanghe_crm"
```

```bash
# .env.local（實際填入，不進 git）
DATABASE_URL="postgresql://你的帳號:你的密碼@localhost:5432/guanghe_crm"
```

```
# .gitignore 確保包含
.env.local
.env
```

---

## 12. BUSINESS RULES SUMMARY

| 規則 | 觸發時機 | 執行位置 |
|------|---------|---------|
| 借址客戶新增時自動建立 5 筆 KYC | POST /api/clients | Server（Prisma transaction） |
| KYC 未全部通過不得進入「已簽約」 | 看板拖拉、stage 更新 | 前端（快速回饋）+ Server（強制驗證） |
| 切換收款為「已收」自動填 paid_at | PATCH payment status | Server |
| 切換收款離開「已收」清空 paid_at | PATCH payment status | Server |
| 跟進日期顏色判斷 | 卡片渲染 | Client（純顯示邏輯） |

---

## 13. DEVELOPMENT ORDER

| Step | 工作內容 | 關鍵檔案 |
|------|---------|---------|
| 1 | 建立 PostgreSQL DB + 初始化 Next.js 專案 + 安裝套件 | `package.json` |
| 2 | 建立 Prisma schema + migration + seed | `prisma/schema.prisma`, `prisma/seed.ts` |
| 3 | 建立 Prisma singleton + 型別定義 + 工具函式 | `lib/prisma.ts`, `lib/types.ts`, `lib/utils.ts` |
| 4 | API Routes（clients CRUD + KYC + payments + dashboard） | `app/api/**` |
| 5 | CRM 看板頁（含 DnD + 拖拉規則 + 卡片） | `app/page.tsx`, `components/board/**` |
| 6 | 新增客戶表單 | `app/clients/new/page.tsx`, `components/clients/ClientForm.tsx` |
| 7 | 客戶詳情頁（KYC + 收款） | `app/clients/[id]/page.tsx`, `components/clients/**` |
| 8 | 儀表板 | `app/dashboard/page.tsx`, `components/dashboard/**` |
| 9 | Loading skeleton + Toast + UI 細節 | `components/ui/**` |

---

## 14. ACCEPTANCE CRITERIA MAPPING

| AC | 驗收標準 | 對應實作 |
|----|---------|---------|
| AC-1 | 看板 7 欄、各有卡片 | `KanbanBoard` + GET /api/clients |
| AC-2 | 拖拉更新 DB | `onDragEnd` + PATCH /api/clients/[id] |
| AC-3 | KYC 未通過阻擋「已簽約」 | 前端 toast + Server 422 回應 |
| AC-4 | 點卡片進詳情頁 | `ClientCard` router.push + GET /api/clients/[id] |
| AC-5 | KYC 5 項可切換狀態 | `KycChecks` + PATCH /api/clients/[id]/kyc |
| AC-6 | 新增收款、切換收款狀態 | `PaymentList` + POST/PATCH payments |
| AC-7 | 儀表板 3 個數字 | `MetricCard` + GET /api/dashboard |
| AC-8 | 逾期清單 | `OverdueTable` + GET /api/dashboard |
| AC-9 | 新增客戶自動建 KYC | POST /api/clients（transaction） |
| AC-10 | Loading + Toast | `Skeleton` + `react-hot-toast` |
