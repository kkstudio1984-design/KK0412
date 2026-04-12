# 交接手冊｜光合創學空間營運 CRM

> 最後更新：2026-04-12

---

## 1. 專案概述

為光合創學空間客製化的輕量 CRM，核心功能：

- 以 **Kanban 看板**追蹤客戶銷售階段（7 個 Stage）
- **KYC 審核管控**：借址登記客戶須 5 項全通過才可推進到「已簽約」
- **收款追蹤**：新增收款、切換收款狀態、逾期標記
- **儀表板**：本月應收 / 實收 / 缺口 / 逾期清單

---

## 2. 技術棧

| 層 | 技術 |
|---|---|
| Framework | Next.js 14（App Router, TypeScript） |
| 樣式 | Tailwind CSS |
| ORM | Prisma + PostgreSQL |
| 拖拉 | @hello-pangea/dnd |
| Toast | react-hot-toast |
| 日期 | date-fns |

---

## 3. 本機啟動

### 前置需求

- Node.js 18+
- PostgreSQL（本機）

### 步驟

```bash
# 1. 安裝依賴
npm install

# 2. 建立資料庫
createdb guanghe_crm

# 3. 建立 .env.local（Next.js 讀取）
echo 'DATABASE_URL="postgresql://<user>@localhost:5432/guanghe_crm"' > .env.local

# 4. 執行 migration
npx prisma migrate deploy

# 5. Seed 初始資料（可選）
npx prisma db seed

# 6. 啟動開發伺服器
npm run dev
```

開啟 http://localhost:3000（若 3000 被佔用則自動改用 3001）

### 注意事項

- **`.env`** — Prisma CLI 使用（`prisma migrate dev` 等指令），需填入 PostgreSQL 連線字串。目前內容為 Prisma 初始化時產生的範本，請替換成本機 DB URL。
- **`.env.local`** — Next.js 應用程式使用，已正確設定本機 DB URL，不進 git。
- `.env.example` 有欄位範本，不含真實值。

---

## 4. 目錄結構

```
guanghe-crm/
├── app/
│   ├── layout.tsx              # Root layout（側邊欄 + Toaster）
│   ├── page.tsx                # / — CRM 看板
│   ├── loading.tsx             # 看板 Skeleton
│   ├── clients/
│   │   ├── new/page.tsx        # /clients/new — 新增客戶表單
│   │   └── [id]/
│   │       ├── page.tsx        # /clients/[id] — 客戶詳情
│   │       └── loading.tsx
│   ├── dashboard/
│   │   ├── page.tsx            # /dashboard — 儀表板
│   │   └── loading.tsx
│   └── api/
│       ├── clients/
│       │   ├── route.ts        # GET /api/clients, POST /api/clients
│       │   └── [id]/
│       │       ├── route.ts    # GET /api/clients/[id], PATCH /api/clients/[id]
│       │       ├── kyc/route.ts        # PATCH /api/clients/[id]/kyc
│       │       └── payments/
│       │           ├── route.ts        # GET/POST /api/clients/[id]/payments
│       │           └── [pid]/route.ts  # PATCH /api/clients/[id]/payments/[pid]
│       └── dashboard/route.ts  # GET /api/dashboard
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx     # DragDropContext + onDragEnd 邏輯
│   │   ├── KanbanColumn.tsx    # 單欄（Droppable）
│   │   └── ClientCard.tsx      # 客戶卡片（Draggable）
│   ├── clients/
│   │   ├── ClientForm.tsx      # 新增客戶表單
│   │   ├── ClientInfo.tsx      # 詳情頁區塊 A（可 inline 編輯）
│   │   ├── KycChecks.tsx       # 詳情頁區塊 B（KYC 查核）
│   │   └── PaymentList.tsx     # 詳情頁區塊 C（收款紀錄）
│   ├── dashboard/
│   │   ├── MetricCard.tsx      # 數字卡片
│   │   └── OverdueTable.tsx    # 逾期清單
│   └── ui/
│       ├── SideNav.tsx         # 側邊導覽
│       ├── Badge.tsx           # 狀態標籤
│       └── Skeleton.tsx        # Loading skeleton
├── lib/
│   ├── prisma.ts               # Prisma Client singleton
│   ├── queries.ts              # Server Component 用的 DB 查詢函式
│   ├── types.ts                # 所有 TypeScript 型別
│   └── utils.ts                # 工具函式（日期、金額格式化等）
└── prisma/
    ├── schema.prisma           # DB schema
    └── seed.ts                 # 初始資料（5 間公司、5 位客戶）
```

---

## 5. 資料庫 Schema

### 主要 Model

```
Organization         — 公司/客戶基本資料（名稱、統編、聯絡人）
SpaceClient          — 空間服務合約（服務類型、階段、月費、跟進資訊）
KycCheck             — 借址登記 KYC 查核項目（5 筆/客戶）
Payment              — 收款紀錄
```

### 關聯

```
Organization  1──* SpaceClient
SpaceClient   1──* KycCheck
SpaceClient   1──* Payment
```

### 重要欄位

| Model | 欄位 | 說明 |
|---|---|---|
| SpaceClient | `stage` | 客戶所在銷售階段（7 種） |
| SpaceClient | `followUpDate` | 下次跟進日，超過今天顯示紅色 |
| SpaceClient | `redFlags` | 字串陣列，風險備註 |
| KycCheck | `status` | `待查` / `通過` / `異常` |
| Payment | `status` | `未收` / `已收` / `逾期` |
| Payment | `paidAt` | 切換為「已收」時自動填入，取消時清空 |

---

## 6. API 端點

| 方法 | 路徑 | 說明 |
|---|---|---|
| GET | `/api/clients` | 看板用，含 `hasOverduePayment` 計算欄位 |
| POST | `/api/clients` | 建立客戶（org + space_client，借址自動建 5 筆 KYC） |
| GET | `/api/clients/[id]` | 完整資料（含 kycChecks + payments） |
| PATCH | `/api/clients/[id]` | 更新欄位（含 stage、org 欄位） |
| PATCH | `/api/clients/[id]/kyc` | 更新單筆 KYC 狀態 |
| GET | `/api/clients/[id]/payments` | 收款列表 |
| POST | `/api/clients/[id]/payments` | 新增收款 |
| PATCH | `/api/clients/[id]/payments/[pid]` | 切換收款狀態 |
| GET | `/api/dashboard` | 儀表板數字（應收/實收/逾期清單） |

---

## 7. 核心業務規則

### KYC 鎖定

- 服務類型為**借址登記**的客戶，建立時自動新增 5 筆 KYC 查核（`商工登記`、`司法院裁判書`、`動產擔保`、`Google搜尋`、`實質受益人審查`）
- 將 stage 拖拉至「已簽約」時：
  - **前端**：`KanbanBoard.tsx` 的 `onDragEnd` 先檢查 kycChecks，未全通過立即 toast 阻擋並 rollback
  - **後端**：`PATCH /api/clients/[id]` 亦做相同驗證，回傳 `422` 防止繞過前端

### 跟進日期顏色

| 距今 | 顏色 |
|---|---|
| 3 天以上 | 綠色 |
| 1–2 天 | 黃色 |
| 今天或已過 | 紅色 |

### 收款狀態切換

- 切換為「已收」→ 自動寫入 `paidAt = now()`
- 離開「已收」→ 自動清空 `paidAt`

---

## 8. 架構決策記錄

### Server Component 直接查 DB

Next.js App Router 的 Server Component 不應透過 HTTP 打自己的 API route（會有 port 不一致的問題）。本專案將共用查詢邏輯抽取至 `lib/queries.ts`，Server Component 直接呼叫，Client Component 仍透過 fetch 呼叫 API route。

### Optimistic UI

看板拖拉採 Optimistic UI：
1. 前端立即更新 state
2. 非同步呼叫 `PATCH /api/clients/[id]`
3. API 失敗時 rollback 至原始 state + 顯示 toast

---

## 9. 常見操作

### 新增欄位到客戶資料

1. 修改 `prisma/schema.prisma`
2. `npx prisma migrate dev --name <描述>`
3. 更新 `lib/types.ts` 型別
4. 更新 `lib/queries.ts`（查詢）與對應 API route（寫入）
5. 更新對應 Component

### 新增 KYC 查核項目

1. 在 `lib/types.ts` 的 `KYC_CHECK_TYPES` 陣列新增
2. 對應 `prisma/schema.prisma` 的 `CheckType` enum 新增
3. 執行 migration

### 重設資料庫

```bash
npx prisma migrate reset   # 清空並重跑 migration + seed
```
