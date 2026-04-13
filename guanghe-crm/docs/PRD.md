# 光合創學營運管理系統 PRD v2.1

> 最終版 PRD。合併 v2 原始需求 + 2026/04/13 技術決策更新。
> Claude 每次開新對話只要讀這一份 + sprint-plan.md，就能掌握系統全貌。

---

## PART 0 | 技術決策紀錄

### 2026/04/13 決策

| 決策項目 | 結論 | 原因 |
|---------|------|------|
| Tech Stack | Next.js + **Supabase** + Vercel + Tailwind CSS | Supabase 內建 Google OAuth、RLS 角色權限、DB triggers（audit_logs）、Realtime（多人看板），省一整個 sprint |
| 資料庫 | Supabase PostgreSQL（取代 Prisma + Neon） | Auth + DB + Realtime 一站式 |
| ORM | Supabase Client（取代 Prisma） | 與 Supabase Auth/RLS 原生整合 |
| 部署 | Vercel | Next.js 原生支援，已設定完成 |
| 認證 | Supabase Auth + Google OAuth | 內建，不需 NextAuth.js |

### 架構原則

- 單一 Next.js App，用角色分頁面權限
- 模組化資料表設計，共用 organizations / users / partners
- 6 人使用（1 admin + 2 operator + 3 viewer），Supabase 免費額度足夠

---

## PART 1 | 系統全貌

### 1-1 PROJECT OVERVIEW

- **System Name:** 光合創學營運管理系統（Guanghe OMS）
- **Vision:** 一套涵蓋六大部門的整合式營運後台，讓 3 人核心團隊用最少人力管理空間、專案、財務、銷售、培訓與 AI 工具鏈的完整營運流程。
- **Architecture:** 模組化設計，六大子系統共用一套基礎資料層（人員、組織、權限），各自獨立開發、獨立上線，透過共用鍵串接。
- **Current Phase:** Phase 1 MVP — 空間營運模組
- **Target Launch:** 2026/07/01（三院空間正式營運前上線）
- **Tech Stack:** Next.js 14 + Supabase (PostgreSQL + Auth + Realtime) + Vercel + Tailwind CSS

### 1-2 ARCHITECTURE MAP

```
共用資料層 (users / organizations / partners)
  |
  +-- M1 空間營運（借址・工位・場地）       ← Phase 1 MVP
  +-- M2 專案接案（影片・配圖・社群・共影） ← Phase 2
  +-- M3 業務銷售（BNI・蒲公英・ESG）      ← Phase 2
  +-- M4 行政財務（合約・收款・補助・人事） ← Phase 1 基礎 / Phase 2 完整
  +-- M5 教育訓練（同理心體驗・企培・AI）   ← Phase 3
  +-- M6 AI 戰略（工具管理・Agent・培訓）   ← Phase 3

跨模組資料流:
  M1 → M4: 客戶・合約・收款
  M2 → M4: 接案收入・夥伴派工
  M3 → M1: leads 轉入 space_clients
  M3 → M2: leads 轉入 projects
  M5 → M3: 企業客戶回流
  M5 → M4: 課程收入
  M6 → M2: 培訓紀錄
```

### 1-3 DEVELOPMENT PHASES

| Phase | 時程 | 模組 | 交付目標 |
|-------|------|------|---------|
| Phase 1 (MVP) | 2026/04 ~ 06 | M1 空間營運 + M4 基礎收款 | CRM 看板、KYC、文件檢核、合約收款、信件代收、退場流程、三層儀表板、地址風險、操作軌跡 |
| Phase 2 | 2026/07 ~ 09 | M2 + M3 + M4 完整 | 專案派工、銷售 Pipeline、ESG、三線營收儀表板 |
| Phase 3 | 2026/10 ~ 12 | M5 + M6 | 課程管理、AI 工具管理 |
| Phase 4 | 2027 Q1 | 整合優化 | 跨模組儀表板、LINE 通知、Notion 同步 |

### 1-4 USERS & PERMISSIONS

```
Role: admin (營運長・光光)
  - Full CRUD on all modules
  - Can override KYC blocks (must provide reason)
  - Can modify system permission settings (唯一)

Role: operator (櫃檯行政，MVP 即啟用)
  - Full CRUD on all modules (與 admin 操作權限相同)
  - Cannot modify system permission settings
  - 主要負責：KYC 查核、文件檢核、信件代收、客戶日常管理

Role: viewer (股東：Miu、刀神、小宇)
  - Read-only: dashboard + client list
  - Cannot edit any data

Role: partner (預留 Phase 2+)

Auth: Google OAuth (via Supabase Auth)
Concurrent users: 5 max (MVP)
```

---

## PART 2 | 共用資料層

所有模組共用以下三張基礎表。MVP 就要建立。

### users (系統使用者)
- id (uuid, PK) -- Supabase auth.users.id
- name (text)
- email (text, unique)
- role (enum: admin | operator | viewer | partner)
- created_at (timestamptz)

### organizations (客戶/合作組織)
- id (uuid, PK)
- name (text)
- tax_id (text, nullable) -- 統一編號
- contact_name (text)
- contact_phone (text)
- contact_email (text)
- contact_line (text, nullable)
- representative_address (text, nullable) -- 負責人戶籍地址
- representative_id_number (text, nullable) -- 負責人身分證字號
- org_type (enum: 客戶 | 合作夥伴 | 贊助企業 | 政府單位)
- source (enum: LINE表單 | BNI轉介 | 記帳師轉介 | 蒲公英 | ESG | 自來客 | 其他)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

### partners (身障夥伴)
- id (uuid, PK)
- user_id (uuid, FK -> users.id, nullable)
- name (text)
- disability_type (text)
- disability_level (enum: 輕度 | 中度 | 重度 | 極重度)
- skill_level (enum: 基礎 | 中階 | 進階)
- skills (text[])
- employment_type (enum: 按月計酬 | 按件計酬)
- onboarded_at (date)
- status (enum: 在職 | 培訓中 | 離職)
- created_at (timestamptz)

---

## PART 3 | MVP 開發規格 (M1 + M4 基礎)

### 3-1 DATA MODEL

#### space_clients (空間客戶)
- id (uuid, PK)
- org_id (uuid, FK -> organizations.id)
- service_type (enum: 借址登記 | 共享工位 | 場地租借)
- plan (text)
- monthly_fee (integer)
- stage (enum: 初步詢問 | KYC審核中 | 已簽約 | 服務中 | 退租中 | 已結案 | 已流失)
- next_action (text)
- follow_up_date (date)
- red_flags (text[])
- is_disability_partner (boolean)
- lost_reason (text, nullable)
- lost_at (timestamptz, nullable)
- is_high_risk_kyc (boolean, default false)
- blacklist_flag (boolean, default false)
- beneficial_owner_name (text, nullable)
- beneficial_owner_verified_at (timestamptz, nullable)
- assigned_seats (integer, default 1)
- access_cards_issued (integer, default 0)
- access_card_numbers (text[], nullable)
- notes (text)
- created_at (timestamptz)
- updated_at (timestamptz)

#### kyc_checks
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- check_type (enum: 商工登記 | 司法院裁判書 | 動產擔保 | Google搜尋 | 實質受益人審查)
- status (enum: 通過 | 異常 | 待查)
- override_reason (text, nullable)
- checked_at (timestamptz)

#### client_documents
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- document_type (text)
- required (boolean)
- status (enum: 未繳 | 已繳 | 待補正)
- submitted_at (timestamptz, nullable)
- notes (text, nullable)

#### contracts
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- contract_type (enum: 借址登記 | 共享工位 | 場地租借)
- payment_cycle (enum: 月繳 | 季繳 | 半年繳 | 年繳)
- start_date (date)
- end_date (date)
- monthly_rent (integer)
- deposit_amount (integer)
- deposit_status (enum: 未收 | 已收 | 已退)
- is_notarized (boolean, default false)
- notarized_at (timestamptz, nullable)

#### payments
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- contract_id (uuid, FK -> contracts.id)
- due_date (date)
- amount (integer)
- status (enum: 已收 | 未收 | 逾期)
- paid_at (timestamptz, nullable)
- escalation_level (enum: 正常 | 提醒 | 催告 | 存證信函 | 退租啟動)
- escalation_updated_at (timestamptz, nullable)

#### mail_records
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- received_date (date)
- mail_type (enum: 掛號 | 平信 | 法院文書)
- tracking_number (text, nullable)
- sender (text)
- pickup_status (enum: 待領取 | 已領取 | 已退回)
- notified_at (timestamptz, nullable)
- final_notice_at (timestamptz, nullable)
- picked_up_at (timestamptz, nullable)

#### offboarding_records
- id (uuid, PK)
- space_client_id (uuid, FK -> space_clients.id)
- request_date (date)
- contract_end_date (date)
- early_termination (boolean)
- penalty_amount (integer, nullable)
- settlement_status (enum: 待結算 | 已結算)
- address_migration_status (enum: 待遷出 | 已通知 | 逾期未遷 | 已確認遷出)
- migration_deadline (date)
- migration_confirmed_at (timestamptz, nullable)
- deposit_refund_status (enum: 待退 | 部分扣抵 | 已退 | 全額沒收)
- deposit_refund_amount (integer, nullable)
- deposit_deduction_reason (text, nullable)
- status (enum: 進行中 | 已結案)
- closed_at (timestamptz, nullable)

#### audit_logs
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- table_name (text)
- record_id (uuid)
- field_name (text)
- old_value (text, nullable)
- new_value (text, nullable)
- changed_at (timestamptz)

### 3-2 CRM BOARD RULES

- RULE-1: 借址登記 -> 5 KYC 全通過 + 必要文件全已繳 -> 才能推進到「已簽約」
- RULE-2: 共享工位/場地租借 -> 跳過 KYC，但必要文件需已繳
- RULE-3: 跟進倒數 badge（綠 >=3天 / 黃 1~2天 / 紅 逾期）
- RULE-4: 紅旗 badge（業種可疑/資料不齊/逾期未繳/高風險KYC/黑名單）
- RULE-5: 14 天無回應 -> 系統建議標記流失 -> 行政確認後移至已流失
- RULE-6: service_type 從工位改為借址 -> 自動觸發 KYC + 文件清單

### 3-3 KYC RULES

- RULE-7: 每項查核 status IN (通過, 異常, 待查)
- RULE-8: 5 項全通過才能推進到已簽約
- RULE-9: 任一異常 -> 自動紅旗 + 阻擋推進
- RULE-10: admin 可 override -> 必須填 override_reason（audit trail）
- RULE-11: beneficial_owner_verified_at + 365 天 < today -> 儀表板提醒覆核

### 3-4 CONTRACTS & PAYMENTS RULES

- RULE-12: 繳款日前 3 天 -> 黃色警示
- RULE-13: 繳款日當天未標記已收 -> 紅色警示
- RULE-14: 合約到期前 30 天 -> 續約提醒
- RULE-15: 股東可看本月營收 + 逾期未收清單
- RULE-16: 四階段升級
  - 逾期 7 天 -> 提醒
  - 逾期 14 天 -> 催告
  - 逾期 30 天 -> 存證信函
  - 逾期 60 天 -> 退租啟動

### 3-5 MAIL RULES

- RULE-17: 法院文書 -> 緊急標記、置頂、紅色
- RULE-18: 通知後 7 天未領 -> 黃色
- RULE-19: 通知後 14 天 -> 最後通知
- RULE-20: 通知後 21 天 -> 自動標記已退回

### 3-6 EXIT RULES

- RULE-21: 觸發條件 = 客戶主動 | 逾期 60 天 | 合約到期未續約
- RULE-22: 遷出追蹤（借址）
  - 遷出期限 = 合約終止日 + 30 天
  - 超 30 天未遷 -> 扣押金 50%
  - 超 60 天未遷 -> 全額沒收 + 觸發出租人單方申請廢止登記
- RULE-23: 退場完成 = 已結算 + 已確認遷出 + 押金處理完畢

### 3-7 DOCUMENT CHECKLIST

借址登記 7 項:
1. 負責人雙證件影本
2. 公司名稱預查核准函或設立/變更登記表影本
3. 經濟部商工登記公示資料列印本
4. 實質受益人聲明書/審查表
5. 股東名冊
6. 公司大小章
7. 蓋印合約

共享工位 2 項:
1. 承租方身分證或公司變更登記表
2. 實際進駐人員名單（姓名+證件）

### 3-8 DASHBOARD (三層式)

第一層 救火層:
1. 緊急信件待處理（法院文書 + 超 7 天未領取）
2. KYC 超時未完成（審核中超 7 天）
3. 今天該跟進的客戶
4. 逾期收款含升級階段
5. 年度 KYC 覆核到期

第二層 生存層:
1. 本月應收 vs 實收 vs 缺口
2. 三條收入線（借址/工位/會議室）
3. 紅線 = NT$150,000/月
4. 目標線 = NT$375,000/月
5. 未來 90 天現金流預測
6. 目前持有押金總額

第三層 成長層:
1. Pipeline 各階段數量
2. 本月轉化率
3. 平均成交週期
4. 客戶來源品質分析
5. 座位超賣率（已售/40）

### 3-9 REVENUE TARGETS

- 年度目標: NT$4,500,000（月均 NT$375,000）
- 損益平衡: NT$150,000/月
- 借址登記 24%: 月均 NT$90,000，目標 40 客戶
- 共享座位 60%: 月均 NT$225,000，目標 65 會員/40 座位
- 會議室 16%: 月均 NT$60,000

### 3-10 ACCEPTANCE CRITERIA

- AC-1: 看板七階段拖拉推進
- AC-2: 借址 KYC 未完 + 文件未齊 -> 阻擋推進到已簽約
- AC-3: 股東登入 -> 唯讀
- AC-4: 收款逾期 -> 儀表板顯示升級階段
- AC-5: 法院文書 -> 自動置頂標紅
- AC-6: operator -> CRUD 全開，無權限管理
- AC-7: 借址 5 KYC + 文件全通過才能簽約
- AC-8: 14 天無回應 -> 流失判定提醒
- AC-9: 退租遷出 30 天扣 50%，60 天全額沒收
- AC-10: 關鍵欄位修改 -> audit_logs 自動記錄
- AC-11: 儀表板三層結構正確顯示
- AC-12: 地址風險總覽 -> 可依統編/負責人搜尋

### 3-11 NON-FUNCTIONAL

- 5 concurrent users max
- Desktop-first, Tailwind responsive reserved
- Data retention: permanent (client/payment), 5+ years (mail)
- Performance: < 100 records, Supabase free tier sufficient
- Security: Supabase Auth + Google OAuth + RLS

### 3-12 OUT OF SCOPE (MVP)

- LINE 通知整合
- Notion 雙向同步
- 電子簽章
- 完整年度 KYC 自動覆核（MVP 做簡易版）
- 多空間管理
- KYC 截圖上傳
- KYC API 自動串接
- 合約 PDF 自動產出
- 即時座位管理

---

## PART 4 | 未來模組資料結構 (Phase 2-3 參考)

> MVP 不開發，但開發時應參照以下結構避免阻斷擴充。

### M2 專案接案: projects, tasks, partner_earnings
### M3 業務銷售: leads, sponsorships
### M4 完整財務: revenue_records, subsidy_tracking, expenses
### M5 教育訓練: courses, course_sessions, enrollments
### M6 AI 戰略: ai_tools, training_records, agents

(完整欄位定義見原始 PRD v2 文件)

---

## PART 5 | Audit Trail 必追蹤欄位

- contracts: monthly_rent, payment_cycle, deposit_amount, deposit_status
- payments: status, amount
- kyc_checks: status, override_reason
- organizations: tax_id, contact_name, name, representative_address
- space_clients: stage, is_high_risk_kyc, blacklist_flag
