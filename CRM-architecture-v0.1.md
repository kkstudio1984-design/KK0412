# guanghe-crm 完整架構盤點 v0.1

> 建立日期：2026-05-13
> 性質：現況盤點（v1 體質檢查），不是未來設計
> 對應藍圖：`CRM-architecture-v0.2-blueprint.md`（下一份）
> 配套 PRD：`CRM-realign-PRD-v0.1.md`

---

## 一、規模總覽

| 維度 | 數量 |
|------|-----|
| 資料表（migration 累積） | **35 張** |
| Migration 檔案 | 22 個（包含階段一新增的 022） |
| API 端點 | **64 個** route.ts |
| Dashboard 頁面 | **40 個**（含子頁面） |
| Cron jobs | 3 個（keepalive、monthly-report、notifications） |
| TS/TSX 檔案 | 350+ 個 |
| Git commits | 90+ 個（30 天） |

---

## 二、資料層（35 張表）

### 2.1 核心客戶層（migration 001、022）

| 表 | 用途 | 五腳對應度 |
|----|------|---------|
| profiles | 系統使用者（內部員工） | 🟢 五腳通用 |
| organizations | 客戶組織主檔（含新加的 `client_type`） | 🟢 五腳通用、是分流核心 |
| partners | 合作夥伴／身障夥伴 | 🟡 第三腳 BPO 要擴張 |
| space_clients | 借址登記的客戶細節 | 🔴 借址專用，新業務用不到 |
| kyc_checks | KYC 5 項檢查 | 🔴 借址專用 |
| client_documents | 客戶文件 | 🟢 五腳通用 |
| contracts | 合約 | 🟢 五腳通用（合約範本要五腳化） |
| payments | 收款記錄 | 🟢 五腳通用 |
| mail_records | 信件處理（借址客戶收信） | 🔴 借址專用 |
| offboarding_records | 退場記錄 | 🟡 工位／借址用，新業務少用 |
| audit_logs | 操作軌跡 | 🟢 五腳通用 |

### 2.2 業務模組層

| Migration | 模組 | 表 |
|-----------|------|-----|
| 003 | M3 Sales | leads、sponsorships |
| 004 | M4 Finance | revenue_records、subsidy_tracking、expenses |
| 005 | M2 Projects | projects、tasks、partner_earnings |
| 006 | M5 Training | courses、course_sessions、enrollments |
| 007 | M6 AI | ai_tools、training_records、agents |
| 011 | 訪客／座位 | visitor_logs、seats、seat_occupancy |
| 012 | 現金核對 | cash_reconciliations、cash_transactions |

### 2.3 基礎建設層

| Migration | 用途 | 表 |
|-----------|------|-----|
| 002 | Audit triggers | （無新表，加 trigger） |
| 008 | 通知系統 | notifications |
| 009 | 事件管理 | incidents |
| 010 | 出勤／變更通知 | attendance_records、change_notifications |
| 013 | Email 範本 | email_templates |
| 014 | 知識庫 | knowledge_docs |
| 020 | Email 寄送記錄 | email_logs |

### 2.4 既有表的欄位擴充（不新增表）

| Migration | 加在哪張表 | 加什麼 |
|-----------|---------|--------|
| 015 | contracts | 電簽欄位（token、status） |
| 016 | （多張） | 簽署頁所需 RLS policies |
| 017 | contracts | signature_image 欄位 |
| 018 | contracts | 簽署完成通知欄位 |
| 019 | contracts | reject_reason 拒簽原因 |
| 021 | organizations | last_contacted_at 欄位 |
| 022 | organizations | client_type 欄位（五腳分流） |

---

## 三、API 層（64 個端點）

### 3.1 客戶相關（最大模組，16 個端點）

```
/api/clients
  /                            POST/GET 列表與新建
  /[id]                        GET/PATCH/DELETE 單一客戶
  /[id]/changes                POST/GET 客戶資料變更
  /[id]/changes/[changeId]     單一變更
  /[id]/contracts              客戶合約
  /[id]/documents              客戶文件
  /[id]/incidents              客戶事件
  /[id]/incidents/[incidentId] 單一事件
  /[id]/kyc                    KYC 主資料
  /[id]/kyc/renew              KYC 續期
  /[id]/log-contact            主動聯繫記錄（21 新增）
  /[id]/mail                   信件記錄（借址）
  /[id]/offboarding            退場記錄
  /[id]/payments               收款列表
  /[id]/payments/[pid]         單一收款
```

### 3.2 業務銷售（5 個）

```
/api/leads                     線索
/api/leads/[id]
/api/leads/[id]/convert        Lead 轉客戶
/api/sponsorships              ESG 贊助（第一腳的入口！）
/api/sponsorships/[id]
```

### 3.3 專案接案（5 個）

```
/api/projects
/api/projects/[id]
/api/projects/[id]/tasks
/api/projects/[id]/tasks/[taskId]
/api/partners/[id]/earnings    夥伴酬勞
/api/partners/[id]/earnings/[earningId]
```

### 3.4 財務（6 個）

```
/api/finance/revenue
/api/finance/expenses
/api/finance/subsidies         政府補助（第二腳的入口！）
/api/finance/subsidies/[id]
/api/finance/cash/reconciliations
/api/finance/cash/transactions
```

### 3.5 教育訓練（5 個）— 第四腳 AI 學院的基礎

```
/api/courses
/api/courses/[id]
/api/courses/[id]/sessions
/api/courses/[id]/sessions/[sessionId]
/api/courses/[id]/sessions/[sessionId]/enrollments
```

### 3.6 夥伴管理（2 個）— 第三腳 BPO 的基礎

```
/api/partners
/api/partners/[id]/attendance
```

### 3.7 AI 工具（4 個）

```
/api/ai-tools, /[id]
/api/agents, /[id]
```

### 3.8 內容與支援（7 個）

```
/api/knowledge, /[id]
/api/email-templates
/api/admin/email-templates, /[id]
/api/notifications
/api/search
/api/reports/monthly
/api/reports/preview-monthly
```

### 3.9 簽署流程（2 個 — 公開端點）

```
/api/contracts/[id]/sign-request
/api/sign/[token]              公開簽署頁
```

### 3.10 訪客／座位（3 個）

```
/api/visitors, /[id]
/api/seats, /occupancy, /occupancy/[id]
```

### 3.11 系統（4 個）

```
/api/admin/users
/api/cron/keepalive
/api/cron/monthly-report
/api/cron/notifications
/api/share/board/2026q2       分享版董事會簡報
```

---

## 四、UI 層（40 個頁面）

### 4.1 客戶模組（4 頁）

```
/clients              客戶列表（Kanban）
/clients/new          新增客戶
/clients/[id]         客戶詳情
/address-risk         🔴 借址風險（v0.1 階段一已從導航拿掉）
```

### 4.2 業務銷售（5 頁）

```
/sales                銷售主頁
/sales/leads          線索列表
/sales/leads/new      新增線索
/sales/leads/[id]     線索詳情
/sales/sponsorships   ESG 贊助（第一腳入口）
```

### 4.3 專案接案（2 頁）

```
/projects             專案列表
/projects/[id]        專案詳情
```

### 4.4 財務（6 頁）

```
/finance              財務總覽
/finance/cash         現金核對
/finance/expenses     費用
/finance/revenue      營收
/finance/subsidies    政府補助
/finance/subsidies/[id]
```

### 4.5 教育訓練（2 頁）

```
/training             課程列表
/training/[id]        課程詳情
```

### 4.6 夥伴管理（2 頁）

```
/partners             夥伴列表
/partners/[id]        夥伴詳情
```

### 4.7 知識庫（4 頁）

```
/knowledge
/knowledge/new
/knowledge/[id]
/knowledge/[id]/edit
```

### 4.8 報表（3 頁）

```
/reports              報表中心
/reports/rejections   拒絕原因分析
/reports/tax          稅務報表
```

### 4.9 其他（11 頁）

```
/                     首頁／空間營運主頁
/dashboard            儀表板
/calendar             行事曆
/visitors             訪客登記
/seats                🟡 座位管理（v0.1 階段一已降級）
/ai-strategy          AI 戰略
/contracts            合約管理
/admin                管理員主頁
/admin/audit          操作軌跡
/admin/users          使用者管理
/admin/email-templates、/[id]
```

---

## 五、技術依賴與基礎建設

### 5.1 核心 stack

| 層 | 技術 |
|---|------|
| 框架 | Next.js 14 (App Router) |
| 語言 | TypeScript |
| 樣式 | Tailwind CSS + 自訂 design system（深色主題） |
| 資料庫 | Supabase（PostgreSQL + RLS + Realtime） |
| 認證 | Supabase Auth + Google OAuth + Email/Password |
| 部署 | Vercel |
| 圖表 | Recharts |
| 拖拉 | @hello-pangea/dnd |

### 5.2 外部服務依賴

| 服務 | 用途 |
|------|------|
| Supabase Cloud | DB、Auth、Storage、RLS |
| Vercel | 部署、Cron |
| Resend | 交易型 Email（合約簽核、客戶通知） |
| GitHub | 程式碼版控 |

### 5.3 自動化（Cron jobs）

| Job | 觸發頻率（推測） | 用途 |
|-----|---------------|------|
| `/api/cron/keepalive` | 每 5-10 分鐘 | Supabase 連線保活 |
| `/api/cron/notifications` | 每日 | 通知摘要寄送 |
| `/api/cron/monthly-report` | 每月 | 月報寄送（CLAUDE.md 11.2 提到尚未完成） |

---

## 六、模組依賴關係圖

```
[organizations 客戶主檔]
    ├── space_clients ─── kyc_checks
    │                 ─── mail_records
    │                 ─── offboarding_records
    ├── client_documents
    ├── contracts ─── payments
    │            ─── signing flow（電簽、token、reject_reason）
    ├── leads（潛在客戶轉化）
    └── 跨模組關聯：
            ├── projects（M2 接案）
            ├── courses/enrollments（M5 訓練）
            ├── revenue_records（M4 財務）
            ├── partners + partner_earnings
            └── incidents、notifications
```

**核心洞察**：
1. **organizations 是宇宙中心** — 30 張表裡有 20 張直接或間接連到它
2. **space_clients、kyc_checks、mail_records** 是借址專屬 silo，可以整個 quarantine
3. **contracts → payments** 是金流主動脈，五腳全部依賴
4. **courses → enrollments** 是第四腳 AI 學院的現成骨架
5. **partners + partner_earnings** 是第三腳 BPO 的現成骨架
6. **sponsorships** 是第一腳 ESG/DEI 的現成入口（被低估的金礦！）

---

## 七、現況體質診斷

### 7.1 健康（無痛點，繼續用）

| 模組 | 為什麼健康 |
|------|---------|
| contracts 電簽流程 | 015-019 五個 migration 把電簽做到生產級，五腳都能用 |
| email_logs + email_templates | 兩層 Email 架構（每日摘要 / 交易型）已就緒 |
| audit_logs + RLS | 安全性基礎做到位 |
| notifications | 通知系統獨立、可擴展 |
| knowledge_docs | 五腳通用、現成可用 |

### 7.2 健康但對齊不足（要加分類欄位）

| 模組 | 對齊動作 |
|------|---------|
| organizations | 已加 `client_type`（022），UI 還沒接 |
| contracts | 需要加「業務類型」標籤、補五腳範本 |
| sales/leads | pipeline stages 需重新對應五腳 |
| courses | 需加「補助類型」（產投／業界委訓） |
| sponsorships | **現成的 ESG 入口被埋住** — 需要拉到一級導航 |
| partners | 需要「角色」分類（合作夥伴 vs 身障夥伴 BPO） |
| revenue_records | 需加「腳別」分類來追蹤五腳貢獻 |

### 7.3 不健康（借址專屬，新業務用不到）

| 模組 | 處置 |
|------|------|
| space_clients | 🔴 保留資料但 UI 不入口 |
| kyc_checks（5 項） | 🔴 同上 |
| mail_records | 🔴 同上 |
| address-risk 模組 | 🔴 v0.1 階段一已從導航拿掉 |
| seats / seat_occupancy | 🟡 降級（v0.1 階段一已完成） |

### 7.4 缺口（新業務需要但還沒做）

| 缺口 | 對應五腳 | 緊急度 |
|------|---------|--------|
| 政府標案管理（投標 → 決標 → 履約 → 核銷） | 第二腳 | 🟡 等第一個標案進場再做 |
| BPO 夥伴月費／薪資／補助申報 | 第三腳 | 🟡 等第一位夥伴進場再做 |
| AI 學院產投補助專屬流程 | 第四腳 | 🟢 等學院送件再做 |
| 個人 IP 內訓場次追蹤 | 第五腳 | 🟢 可用 projects 模組替代 |
| 儀表板五腳收入堆疊圖 | 通用 | 🔴 高（老闆每天看） |
| 月損益平衡點 $182,520 警戒燈 | 通用 | 🔴 高 |

---

## 八、安全性與合規檢核

| 項目 | 狀態 |
|------|------|
| RLS（Row Level Security） | ✅ 全表啟用 |
| Audit logs | ✅ 全部變更有記錄 |
| Rate limiting | ✅ 已加（4/15 commit） |
| 安全 headers | ✅ 已加 |
| 電簽流程的 token 保護 | ✅ 015-018 完整 |
| 公開分享頁的 token 保護 | ✅ share/board/2026q2 有 token |
| 身權法第 38 條合規（第三腳 BPO） | ❌ 還沒設計，需要 BPO 模組 |
| 個資法（PIPA） | 🟡 RLS 有，但缺正式 retention policy |

---

## 九、下一份文件預告

這份是「**現況盤點**」（v0.1）。下一份是「**新架構藍圖**」（v0.2 blueprint），會回答：

第一，五腳並行下，35 張表要長成什麼樣（保留 / 改 / 砍 / 新增）？
第二，64 個 API 端點如何分流到五腳（哪些跨腳共用、哪些腳專屬）？
第三，40 個頁面如何重組成更清晰的資訊架構（從「按模組」轉成「按業務腳」）？
第四，三層儀表板（救火／生存／成長）的 KPI 重設細節？

---

## 十、給未來自己的提醒

**這份盤點最珍貴的事不是技術細節**，是讓你看到：

第一，你**已經做出來的東西比你以為的多**。35 張表、64 個 API、40 個頁面 — 不是空殼，是生產級系統。**未來懷疑自己「沒做出什麼」時，回來看這份**。

第二，**借址被擋只廢掉系統 5-10% 的功能**。70% 直接通用、20% 改個分類就能用、5-10% 真的廢。比想像中少很多。

第三，**第一腳 ESG/DEI 的入口（sponsorships）已經做好但被埋住**。藍圖階段要把它挖出來，當作主推。
