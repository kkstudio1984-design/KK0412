# TASK.md｜光合創學空間營運 CRM — 開發任務清單

> 對應文件：PRD v1.0 / SDD v1.0
> 總預估時間：~4 小時

---

## 進度總覽

- [x] Step 1 — 環境建置
- [x] Step 2 — Prisma Schema + Migration + Seed
- [x] Step 3 — 基礎設施（lib/）
- [x] Step 4 — API Routes
- [x] Step 5 — CRM 看板頁
- [x] Step 6 — 新增客戶表單
- [ ] Step 7 — 客戶詳情頁
- [ ] Step 8 — 儀表板
- [ ] Step 9 — UI 細節收尾

---

## Step 1｜環境建置（~15 min）

- [x] 建立 PostgreSQL 資料庫：`createdb guanghe_crm`
- [x] 初始化 Next.js 14 專案（App Router + TypeScript）
  ```bash
  npx create-next-app@14 guanghe-crm --typescript --tailwind --app --no-src-dir
  ```
- [x] 安裝依賴套件
  ```bash
  npm install prisma @prisma/client @hello-pangea/dnd react-hot-toast date-fns
  npm install -D @types/node
  ```
- [x] 建立 `.env.local`，填入 `DATABASE_URL`
- [x] 建立 `.env.example`（不含真實密碼）
- [x] 確認 `.gitignore` 包含 `.env.local`

---

## Step 2｜Prisma Schema + Migration + Seed（~15 min）

- [x] 初始化 Prisma：`npx prisma init`
- [x] 撰寫 `prisma/schema.prisma`
  - [x] Model: `Organization`
  - [x] Model: `SpaceClient`
  - [x] Model: `KycCheck`
  - [x] Model: `Payment`
  - [x] Enum: `Source`, `ServiceType`, `Stage`, `CheckType`, `KycStatus`, `PaymentStatus`
- [x] 執行 migration：`npx prisma migrate dev --name init`
- [x] 撰寫 `prisma/seed.ts`（5 間公司、5 個客戶、各階段分佈）
- [x] 設定 seed 指令（`prisma.config.ts`）
- [x] 執行 seed：`npx prisma db seed`
- [x] DB 資料確認（5 筆 space_clients 各階段正確）

---

## Step 3｜基礎設施（~15 min）

- [x] `lib/prisma.ts` — Prisma Client singleton
- [x] `lib/types.ts` — 所有 TypeScript 型別
  - [x] `ClientWithOrg`
  - [x] `KycCheck`
  - [x] `Payment`
  - [x] `DashboardData`
  - [x] `OverdueItem`
  - [x] Stage / ServiceType / KycStatus / PaymentStatus enum 型別
- [x] `lib/utils.ts` — 工具函式
  - [x] `getFollowUpColor(date)`
  - [x] `getFollowUpLabel(date)`
  - [x] `getMonthRange()`
  - [x] `formatNTD(amount)`
  - [x] `getOverdueDays(dueDate)`
- [x] `app/layout.tsx` — Root layout（含側邊 Nav：看板 / 儀表板）

---

## Step 4｜API Routes（~30 min）

- [x] `GET /api/clients`
  - 回傳所有 space_clients + organization
  - 含 `hasOverduePayment` 計算欄位（看板用）
  - 含各客戶 kycChecks（用於拖拉前端驗證）
- [x] `POST /api/clients`
  - Prisma transaction：建 org → 建 space_client → 若借址登記自動建 5 筆 KYC
- [x] `GET /api/clients/[id]`
  - 完整資料：organization + space_client + kycChecks + payments
- [x] `PATCH /api/clients/[id]`
  - 更新 stage 時伺服器端驗證 KYC 鎖定規則（回 422）
  - 更新其他欄位（nextAction, followUpDate, redFlags, notes 等）
- [x] `PATCH /api/clients/[id]/kyc`
  - 更新單筆 KYC 狀態（checkType + status）
- [x] `GET /api/clients/[id]/payments`
- [x] `POST /api/clients/[id]/payments`
  - 新增收款（dueDate, amount）
- [x] `PATCH /api/clients/[id]/payments/[pid]`
  - 切換收款狀態
  - 切換為「已收」自動填 `paidAt = now()`
  - 離開「已收」自動清空 `paidAt`
- [x] `GET /api/dashboard`
  - 服務中客戶數
  - 本月應收 / 本月實收 / 缺口
  - 逾期清單（JOIN organizations）

---

## Step 5｜CRM 看板頁 `/`（~60 min）

- [x] `app/page.tsx` — fetch `/api/clients`，按 stage 分組，傳入看板
- [x] `components/board/KanbanBoard.tsx`
  - [x] `DragDropContext` 包覆整體（`@hello-pangea/dnd`）
  - [x] 7 欄水平排列，水平捲動
  - [x] `onDragEnd` 邏輯：
    - [x] 前端 KYC 鎖定檢查（快速 toast）
    - [x] Optimistic UI 更新
    - [x] PATCH `/api/clients/[id]`
    - [x] API 失敗時 rollback + toast
  - [x] 右上角「+ 新增客戶」按鈕
- [x] `components/board/KanbanColumn.tsx`
  - [x] `Droppable` 欄位
  - [x] 欄位標題 + 客戶數 badge
- [x] `components/board/ClientCard.tsx`
  - [x] `Draggable` 卡片
  - [x] 紅旗標記（hover tooltip 顯示原因）
  - [x] 公司名稱、聯絡人、服務類型
  - [x] 跟進日期（含顏色 + 天數文字）
  - [x] 月費顯示
  - [x] 逾期收款 `💰逾期` 標記
  - [x] 點擊導向 `/clients/[id]`

---

## Step 6｜新增客戶表單 `/clients/new`（~45 min）

- [x] `app/clients/new/page.tsx`
- [x] `components/clients/ClientForm.tsx`
  - [x] 組織資料區塊：公司名稱\*、統一編號、聯絡人\*、電話、Email、LINE、來源
  - [x] 空間服務區塊：服務類型\*、方案名稱、月費、備註
  - [x] Submit 邏輯：POST `/api/clients`
  - [x] 成功後導回 `/`
  - [x] 錯誤時顯示 toast
  - [x] 送出中顯示 loading 狀態

---

## Step 7｜客戶詳情頁 `/clients/[id]`（~45 min）

- [ ] `app/clients/[id]/page.tsx` — fetch `/api/clients/[id]`
- [ ] `components/clients/ClientInfo.tsx`（區塊 A）
  - [ ] 顯示 organization + space_client 所有欄位
  - [ ] 可 inline 編輯並儲存（PATCH `/api/clients/[id]`）
  - [ ] `nextAction`、`followUpDate`、`redFlags` 可編輯
- [ ] `components/clients/KycChecks.tsx`（區塊 B，僅借址登記顯示）
  - [ ] 5 項查核，每項 select 切換狀態
  - [ ] 切換後立即 PATCH
  - [ ] 顯示通過進度（X/5 通過）
  - [ ] 狀態圖示：✅ 通過 / ❌ 異常 / ⏳ 待查
- [ ] `components/clients/PaymentList.tsx`（區塊 C）
  - [ ] 收款列表（due_date, amount, status）
  - [ ] 狀態顏色：綠/紅/灰
  - [ ] 點狀態 inline toggle
  - [ ] 「+ 新增收款」Modal（due_date, amount）

---

## Step 8｜儀表板 `/dashboard`（~30 min）

- [ ] `app/dashboard/page.tsx` — fetch `/api/dashboard`
- [ ] `components/dashboard/MetricCard.tsx`
  - [ ] 服務中客戶數
  - [ ] 本月應收
  - [ ] 本月實收（含缺口）
- [ ] `components/dashboard/OverdueTable.tsx`
  - [ ] 欄位：公司名稱、應繳日期、金額、逾期天數
  - [ ] 按逾期天數降序排列

---

## Step 9｜UI 細節收尾（~15 min）

- [ ] `components/ui/Skeleton.tsx` — 共用 loading skeleton
  - [ ] 看板頁 skeleton（7 欄）
  - [ ] 詳情頁 skeleton
  - [ ] 儀表板 skeleton
- [ ] `components/ui/Badge.tsx` — 狀態標籤元件
- [ ] 全站 Toast 設定（`<Toaster />` 在 layout.tsx）
- [ ] 確認所有 AC 通過（AC-1 ~ AC-10）

---

## 驗收清單（AC）

| AC | 項目 | 通過 |
|----|------|------|
| AC-1 | 看板 7 欄，各有客戶卡片 | [ ] |
| AC-2 | 拖拉更新 DB | [ ] |
| AC-3 | KYC 未通過阻擋「已簽約」並顯示提示 | [ ] |
| AC-4 | 點卡片進入詳情頁 | [ ] |
| AC-5 | KYC 5 項可切換狀態 | [ ] |
| AC-6 | 可新增收款、切換收款狀態 | [ ] |
| AC-7 | 儀表板 3 個數字卡片 | [ ] |
| AC-8 | 儀表板逾期清單 | [ ] |
| AC-9 | 新增借址客戶自動建 5 筆 KYC | [ ] |
| AC-10 | 所有頁面 loading 狀態 + toast 回饋 | [ ] |
