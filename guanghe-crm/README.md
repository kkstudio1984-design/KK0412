# 光合創學營運管理系統 (Guanghe OMS)

一套涵蓋六大部門的整合式營運後台，讓 3 人核心團隊用最少人力管理空間、專案、財務、銷售、培訓與 AI 工具鏈。

**線上版：** https://guanghe-crm.vercel.app

---

## 技術架構

- **前端：** Next.js 14 (App Router) + React 18 + TypeScript
- **樣式：** Tailwind CSS + 自訂 design system
- **資料庫：** Supabase (PostgreSQL + RLS)
- **認證：** Supabase Auth + Google OAuth
- **即時：** Supabase Realtime
- **部署：** Vercel
- **圖表：** Recharts
- **拖拉：** @hello-pangea/dnd

---

## 六大模組

| 模組 | 功能 | 路徑 |
|------|------|------|
| **M1 空間營運** | 借址登記、共享工位、場地租借、KYC、合約、收款、信件、退場 | `/` `/address-risk` |
| **M2 專案接案** | AI影片、SEO配圖、社群經營、手心共影、任務派工 | `/projects` |
| **M3 業務銷售** | Leads Pipeline、ESG 贊助、Lead 轉換 | `/sales` |
| **M4 行政財務** | 營收、費用、政府補助追蹤 | `/finance` |
| **M5 教育訓練** | 課程、場次、報名 | `/training` |
| **M6 AI 戰略** | AI 工具、Agent、夥伴培訓 | `/ai-strategy` |
| **儀表板** | 三層式（救火/生存/成長） | `/dashboard` |

---

## 本機開發

### 1. 安裝

```bash
git clone git@github.com:kkstudio1984-design/KK0412.git
cd KK0412/guanghe-crm
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
```

編輯 `.env` 填入 Supabase 憑證（參考 `.env.example` 裡的取得位置）。

### 3. 資料庫初始化

到 [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) 依序執行：

```
supabase/migrations/001_initial_schema.sql    # 共用資料層 + M1
supabase/migrations/002_audit_triggers.sql    # 操作軌跡 trigger
supabase/migrations/003_m3_sales.sql          # M3 業務銷售
supabase/migrations/004_m4_finance.sql        # M4 完整財務
supabase/migrations/005_m2_projects.sql       # M2 專案接案
supabase/migrations/006_m5_training.sql       # M5 教育訓練
supabase/migrations/007_m6_ai.sql             # M6 AI 戰略
supabase/migrations/008_notifications.sql     # 通知系統
```

### 4. 啟動 dev server

```bash
npm run dev
```

開 http://localhost:3000

---

## 專案結構

```
guanghe-crm/
├── app/
│   ├── (dashboard)/          # 需登入的主應用路由群組
│   │   ├── page.tsx          # CRM 看板（首頁）
│   │   ├── projects/         # M2
│   │   ├── sales/            # M3
│   │   ├── finance/          # M4
│   │   ├── training/         # M5
│   │   ├── ai-strategy/      # M6
│   │   ├── dashboard/        # 三層式儀表板
│   │   └── layout.tsx        # AppShell（側欄 + 頂欄）
│   ├── api/                  # API routes
│   ├── auth/callback/        # OAuth 回調
│   ├── login/                # 登入頁
│   ├── globals.css           # 全局樣式 + CSS 變數
│   └── layout.tsx            # 根 layout（字體、metadata）
├── components/
│   ├── board/                # CRM 看板
│   ├── clients/              # 客戶詳情相關
│   ├── leads/                # M3 銷售管線
│   ├── projects/             # M2 專案
│   ├── sponsorships/         # M3 ESG 贊助
│   ├── finance/              # M4 財務
│   ├── training/             # M5 課程
│   ├── ai-strategy/          # M6 AI 工具
│   ├── dashboard/            # 儀表板卡片 + 圖表
│   ├── address-risk/         # 地址風險表格
│   └── ui/                   # 共用 UI（SideNav、PageHeader、Toast 等）
├── lib/
│   ├── supabase/             # Supabase client（server + browser）
│   ├── hooks/                # React hooks（Realtime）
│   ├── queries.ts            # Server-side data fetching
│   ├── types.ts              # TypeScript 型別定義
│   ├── utils.ts              # 日期、金額等 utilities
│   └── csv.ts                # CSV 匯出
├── supabase/migrations/      # SQL migrations（依序執行）
├── docs/
│   ├── PRD.md                # 完整產品需求文件
│   └── sprint-plan.md        # 10 週 Sprint 計畫
├── middleware.ts             # Auth 中介層
└── .env.example              # 環境變數範本
```

---

## 角色權限

| 角色 | 權限 |
|------|------|
| **admin** | 完整 CRUD + 可改權限設定 |
| **operator** | 完整 CRUD（不能改權限設定） |
| **viewer** | 唯讀（股東用） |
| **partner** | 預留給身障夥伴（目前未啟用） |

新註冊用戶預設為 `viewer`。要改角色需到 Supabase SQL Editor：

```sql
update profiles set role = 'admin' where email = 'xxx@gmail.com';
```

---

## 部署

專案使用 Vercel 自動部署：
- **main 分支** → https://guanghe-crm.vercel.app
- 環境變數設定在 Vercel Dashboard → Settings → Environment Variables

```bash
# 手動部署
npx vercel --prod
```

---

## 常用指令

```bash
npm run dev            # 開發模式
npm run build          # 正式建置
npm run start          # 啟動 production server
npm run lint           # ESLint 檢查
npm run test:e2e       # E2E 測試（headless）
npm run test:e2e:ui    # E2E 測試（UI 模式，可視化）
npm run test:e2e:debug # E2E 測試（debug 模式）
```

---

## E2E 測試

使用 Playwright 做端對端測試。需要一個 Supabase 測試帳號。

### 前置設定

1. **啟用 Supabase email/password 認證**
   到 Supabase Dashboard → Authentication → Providers → Email，開啟。

2. **建立測試使用者**
   到 Authentication → Users → Add user → 填 email + password。

3. **設定為 operator 角色**
   ```sql
   update profiles set role = 'operator' where email = 'test@example.com';
   ```

4. **設定本地 env**
   在 `.env` 加上：
   ```
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=your_test_password
   ```

5. **跑測試**
   ```bash
   npm run test:e2e
   ```

### GitHub Actions CI

Secrets 需要設定（GitHub repo → Settings → Secrets and variables → Actions）：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

Push 到 main 會自動 build，PR 會額外跑 E2E。

---

## 文件

- **PRD** — `docs/PRD.md`（產品需求、驗收標準、資料模型）
- **Sprint Plan** — `docs/sprint-plan.md`（開發時程）

---

## 授權

內部使用，非開源專案。
