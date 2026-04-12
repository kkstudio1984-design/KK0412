# PRD｜光合創學空間營運 CRM — 3~5 小時極簡驗收版

---

## 1. OVERVIEW

**System Name:** 光合創學空間營運 CRM（Guanghe Space CRM）
**Purpose:** 讓光合創學營運長（光光）在一個畫面上掌握所有空間客戶的狀態，從進線到簽約到收款。
**Time Budget:** 3~5 小時（含開發 + 部署 + 測試）
**Tech Stack:** Next.js 14 (App Router) + Supabase (PostgreSQL + JS Client) + Tailwind CSS + Vercel
**Auth:** 不做。本版無登入系統，直接進入主頁面。

---

## 2. DATA MODEL

共 4 張表。建表順序：organizations → space_clients → kyc_checks → payments。

```sql
-- ============================================
-- Table 1: organizations（客戶組織）
-- ============================================
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                          -- 公司名稱
  tax_id TEXT,                                 -- 統一編號（nullable）
  contact_name TEXT NOT NULL,                  -- 聯絡人姓名
  contact_phone TEXT,                          -- 聯絡電話
  contact_email TEXT,                          -- Email
  contact_line TEXT,                           -- LINE 帳號
  source TEXT CHECK (source IN (
    'LINE表單', 'BNI轉介', '記帳師轉介',
    '蒲公英', 'ESG', '自來客', '其他'
  )) DEFAULT '自來客',                          -- 客戶來源
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Table 2: space_clients（空間客戶，1 org : N clients）
-- ============================================
CREATE TABLE space_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN (
    '借址登記', '共享工位', '場地租借'
  )),
  plan TEXT,                                   -- 方案名稱（如：身障優惠方案）
  monthly_fee INTEGER DEFAULT 0,               -- 月費（新台幣）
  stage TEXT NOT NULL CHECK (stage IN (
    '初步詢問', 'KYC審核中', '已簽約',
    '服務中', '退租中', '已結案', '已流失'
  )) DEFAULT '初步詢問',
  next_action TEXT,                            -- 下一步待辦
  follow_up_date DATE,                         -- 跟進日期
  red_flags TEXT[] DEFAULT '{}',               -- 紅旗原因陣列
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Table 3: kyc_checks（KYC 查核，僅借址登記客戶）
-- ============================================
CREATE TABLE kyc_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_client_id UUID NOT NULL REFERENCES space_clients(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL CHECK (check_type IN (
    '商工登記', '司法院裁判書', '動產擔保',
    'Google搜尋', '實質受益人審查'
  )),
  status TEXT NOT NULL CHECK (status IN (
    '通過', '異常', '待查'
  )) DEFAULT '待查',
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Table 4: payments（收款紀錄）
-- ============================================
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_client_id UUID NOT NULL REFERENCES space_clients(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,                      -- 應繳日期
  amount INTEGER NOT NULL,                     -- 金額（新台幣）
  status TEXT NOT NULL CHECK (status IN (
    '已收', '未收', '逾期'
  )) DEFAULT '未收',
  paid_at TIMESTAMPTZ,                         -- 實際收款日期
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Supabase RLS: 全部關閉（無登入系統）
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON space_clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON kyc_checks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON payments FOR ALL USING (true) WITH CHECK (true);
```

**建立 space_client 時的自動行為：**
- 若 `service_type = '借址登記'`，自動建立 5 筆 kyc_checks（每項查核一筆，status 預設 `待查`）

---

## 3. PAGES & ROUTES

共 4 個頁面：

| Route | Page | Description |
|-------|------|-------------|
| `/` | CRM 看板 | 7 欄拖拉看板，每欄一個階段 |
| `/clients/[id]` | 客戶詳情 | 客戶資料 + KYC 查核狀態 + 收款列表 |
| `/clients/new` | 新增客戶 | 表單：組織資料 + 空間客戶資料一次填 |
| `/dashboard` | 儀表板 | 3 個數字卡片 + 逾期清單 |

---

## 4. FEATURE SPECS

### 4-1 CRM 看板（`/`，主頁面）

**Layout:** 7 個直欄，水平捲動，每欄標題為階段名稱。

**7 個階段欄位（左到右）：**
`初步詢問` → `KYC審核中` → `已簽約` → `服務中` → `退租中` → `已結案` → `已流失`

**每張卡片顯示：**
```
┌─────────────────────────┐
│ 🔴 紅旗（若有）          │
│ **公司名稱**             │
│ 聯絡人：王小明            │
│ 服務：借址登記            │
│ 跟進：3 天後 🟢           │
│ 月費：NT$2,500           │
└─────────────────────────┘
```

**跟進日期顏色規則：**
- 🟢 綠色：`follow_up_date >= today + 3`
- 🟡 黃色：`follow_up_date` 在 1~2 天內
- 🔴 紅色：`follow_up_date < today`（已逾期）
- 灰色：未設定 follow_up_date

**紅旗顯示：** 若 `red_flags` 陣列非空，卡片頂部顯示紅色標記，hover 顯示原因。

**逾期收款標記：** 若該客戶有任何 `payments.status = '逾期'`，卡片顯示 `💰逾期` 標記。

**拖拉規則：**

```
RULE-1: 借址登記客戶拖到「已簽約」前檢查：
  IF service_type == '借址登記'
  AND (任一 kyc_checks.status != '通過')
  THEN → 阻擋拖拉，顯示 toast：「KYC 尚未全部通過，無法推進到已簽約」

RULE-2: 其他服務類型（共享工位、場地租借）
  → 無限制，可自由拖拉

RULE-3: 拖拉成功後
  → UPDATE space_clients SET stage = [新階段], updated_at = now()
```

**右上角按鈕：** `+ 新增客戶` → 導向 `/clients/new`

---

### 4-2 新增客戶（`/clients/new`）

**一個表單同時建立 organization + space_client：**

```
欄位清單：
─── 組織資料 ───
公司名稱*          [text, required]
統一編號            [text]
聯絡人姓名*        [text, required]
聯絡電話            [text]
Email              [text]
LINE 帳號           [text]
客戶來源            [select: LINE表單/BNI轉介/記帳師轉介/蒲公英/ESG/自來客/其他]

─── 空間服務 ───
服務類型*          [select: 借址登記/共享工位/場地租借, required]
方案名稱            [text]
月費               [number]
備註               [textarea]
```

**Submit 行為：**
1. INSERT INTO organizations → 取得 org_id
2. INSERT INTO space_clients (org_id, ..., stage='初步詢問')
3. IF service_type == '借址登記' → INSERT 5 筆 kyc_checks（5 種 check_type，status='待查'）
4. 導回 `/`（看板頁）

---

### 4-3 客戶詳情（`/clients/[id]`）

**三個區塊：**

**區塊 A — 基本資料（可編輯）：**
- 顯示 organization + space_client 的所有欄位
- 可直接編輯並儲存
- 可編輯 `next_action`、`follow_up_date`、`red_flags`

**區塊 B — KYC 查核（僅借址登記客戶顯示）：**
```
┌──────────────────────────────────────────┐
│ KYC 查核狀態                              │
│                                          │
│ ✅ 商工登記          [通過 ▼]             │
│ ❌ 司法院裁判書      [異常 ▼]             │
│ ⏳ 動產擔保          [待查 ▼]             │
│ ⏳ Google搜尋        [待查 ▼]             │
│ ⏳ 實質受益人審查    [待查 ▼]             │
│                                          │
│ 進度：1/5 通過                            │
└──────────────────────────────────────────┘
```
- 每項用 select 下拉切換狀態（通過/異常/待查）
- 切換後立即 UPDATE kyc_checks

**區塊 C — 收款紀錄：**
```
┌──────────────────────────────────────────┐
│ 收款紀錄                    [+ 新增收款]  │
│                                          │
│ 2026/05/01  NT$2,500  🟢已收             │
│ 2026/06/01  NT$2,500  🔴逾期             │
│ 2026/07/01  NT$2,500  ⚪未收             │
└──────────────────────────────────────────┘
```
- 點「+ 新增收款」→ 彈出小表單（due_date, amount）
- 點收款列的狀態 → 可切換為 已收/未收/逾期
- 切換為「已收」時自動填入 `paid_at = now()`

---

### 4-4 儀表板（`/dashboard`）

**三張數字卡片：**

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  服務中客戶   │  │  本月應收    │  │  本月實收    │
│     12      │  │  NT$45,000  │  │  NT$32,500  │
│             │  │             │  │  缺口 12,500 │
└─────────────┘  └─────────────┘  └─────────────┘
```

**計算邏輯：**
- 服務中客戶：`SELECT COUNT(*) FROM space_clients WHERE stage = '服務中'`
- 本月應收：`SELECT SUM(amount) FROM payments WHERE due_date BETWEEN 本月第一天 AND 本月最後一天`
- 本月實收：`SELECT SUM(amount) FROM payments WHERE paid_at BETWEEN 本月第一天 AND 本月最後一天 AND status = '已收'`
- 缺口 = 本月應收 - 本月實收

**下方：逾期收款清單**
```
逾期未收清單：
| 公司名稱 | 應繳日期 | 金額 | 逾期天數 |
|---------|---------|------|---------|
| ABC 公司 | 2026/04/01 | NT$2,500 | 10 天 |
```

Query: `payments.status = '逾期'` JOIN space_clients JOIN organizations，按逾期天數排序。

---

## 5. UI/UX GUIDELINES

- **框架：** Tailwind CSS，不使用額外 UI 庫（保持簡單）
- **拖拉套件：** 使用 `@hello-pangea/dnd`（`react-beautiful-dnd` 的維護版 fork）
- **風格：** 簡潔商務風，白底 + 灰邊框 + 藍色主色調
- **Toast 通知：** 使用 `react-hot-toast`，操作成功/失敗時顯示
- **響應式：** Desktop-first，看板頁水平捲動，其他頁面基本響應式
- **載入狀態：** 每個資料載入區塊需有 loading skeleton

---

## 6. SEED DATA（展示用假資料）

為了驗收展示，系統需要預載以下測試資料：

```sql
-- 5 間測試公司，分佈在不同階段
INSERT INTO organizations (name, tax_id, contact_name, contact_phone, source) VALUES
  ('陽光科技有限公司', '12345678', '王大明', '0912-345-678', 'BNI轉介'),
  ('綠意設計工作室', NULL, '林小芳', '0923-456-789', '自來客'),
  ('海洋貿易股份有限公司', '87654321', '張海洋', '0934-567-890', '記帳師轉介'),
  ('山林文創有限公司', '11223344', '李山林', '0945-678-901', 'LINE表單'),
  ('星辰管顧有限公司', '55667788', '陳星辰', '0956-789-012', '蒲公英');

-- 5 個空間客戶，分佈在不同階段
-- Client 1: 初步詢問（借址）
-- Client 2: KYC審核中（借址，有部分 KYC 通過）
-- Client 3: 服務中（借址，KYC 全通過，有收款紀錄）
-- Client 4: 服務中（共享工位，有收款紀錄含逾期）
-- Client 5: 已流失（借址）
```

具體 INSERT 語句由開發時根據上述分佈產生，確保展示時每個階段都有卡片。

---

## 7. ACCEPTANCE CRITERIA（驗收標準）

```
AC-1: 打開首頁看到 CRM 看板，7 個欄位各有對應的客戶卡片
AC-2: 卡片可拖拉到其他階段，拖拉後資料庫同步更新
AC-3: 借址登記客戶 KYC 未全部通過 → 無法拖到「已簽約」，顯示錯誤提示
AC-4: 點擊卡片 → 進入客戶詳情頁，顯示完整資料
AC-5: 借址登記客戶詳情頁顯示 5 項 KYC 查核，可切換狀態
AC-6: 客戶詳情頁可新增收款、切換收款狀態
AC-7: 儀表板顯示服務中客戶數、本月應收、本月實收三個數字
AC-8: 儀表板下方顯示逾期未收清單
AC-9: 新增客戶表單可成功建立客戶，借址客戶自動產生 5 筆 KYC
AC-10: 所有頁面載入時有 loading 狀態，操作後有 toast 回饋
```

---

## 8. OUT OF SCOPE（明確不做）

| 功能 | 原因 |
|------|------|
| 登入/權限系統 | 3~5 小時不夠，展示不需要 |
| Google OAuth | 同上 |
| 文件檢核清單 | 用 KYC 查核代替 |
| 合約完整 CRUD | 簡化為收款追蹤 |
| 四階段催款升級 | 只做逾期標記 |
| 信件代收 | 完全不做 |
| 退場流程 / 遷出追蹤 | 完全不做 |
| 地址風險總覽 | 完全不做 |
| Audit Trail | 完全不做 |
| 14 天自動流失判定 | 完全不做 |
| LINE/Notion 整合 | 完全不做 |
| 行動版優化 | Desktop-first |

---

## 9. FILE STRUCTURE（建議目錄結構）

```
app/
├── layout.tsx                 # 全域 layout（sidebar nav）
├── page.tsx                   # CRM 看板（首頁）
├── dashboard/
│   └── page.tsx               # 儀表板
├── clients/
│   ├── new/
│   │   └── page.tsx           # 新增客戶表單
│   └── [id]/
│       └── page.tsx           # 客戶詳情（含 KYC + 收款）
lib/
├── supabase.ts                # Supabase client 初始化
├── types.ts                   # TypeScript 型別定義
└── utils.ts                   # 工具函式（日期計算等）
```

---

## 10. DEVELOPMENT ORDER（建議開發順序）

| Step | 時間估計 | 內容 |
|------|---------|------|
| 1 | 15 min | Supabase 建專案 + 執行 SQL 建表 + 插入 seed data |
| 2 | 15 min | Next.js 初始化 + 安裝套件 + Supabase client 設定 |
| 3 | 60 min | CRM 看板頁（含拖拉、卡片顯示、階段鎖定規則） |
| 4 | 45 min | 新增客戶表單（含自動建立 KYC） |
| 5 | 45 min | 客戶詳情頁（含 KYC 切換 + 收款管理） |
| 6 | 30 min | 儀表板（3 個數字 + 逾期清單） |
| 7 | 15 min | UI 美化 + loading 狀態 + toast |
| 8 | 15 min | 部署到 Vercel + 最終測試 |
| **Total** | **~4 hr** | |
