-- Migration 024: 跨表業務分類 leg_type 欄位
-- 建立時間：2026-05-13
-- 對應藍圖：CRM-architecture-v0.2-blueprint.md §2.3
-- 目的：在 9 張交易／資產層的表加同一個 leg_type 欄位，解鎖五腳收入堆疊、五腳轉換漏斗等所有跨腳分析
--
-- 跟 022 的 client_type 差異：
--   client_type 是「organizations 客戶屬於什麼類型」（屬性 of 客戶）
--   leg_type 是「這筆交易／資產屬於哪條腳」（屬性 of 交易）
-- 同一個 organization 可能跨腳（買 ESG 訓練包 + 同時買 BPO 月費）
--
-- 設計：TEXT + CHECK，不用 ENUM，方便未來增加類型
-- 預設 other，不執行 UPDATE backfill — 由前端 UI 引導重新分類
-- 風險：低 — 只加新欄位

-- 共用的 CHECK 值集合：
--   esg_dei         第一腳 ESG/DEI 訓練包
--   gov_tender      第二腳 政府身障就業標案
--   inclusion_bpo   第三腳 Inclusion BPO 月費
--   academy         第四腳 AI×共融職能轉換學院
--   personal_ip     第五腳 光光個人 IP × 內訓
--   mixed           跨腳（單筆同時涉及多腳）
--   other           未分類 / 舊資料 fallback

-- 1. organizations
ALTER TABLE IF EXISTS public.organizations
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_organizations_leg_type ON public.organizations(leg_type);

-- 2. leads
ALTER TABLE IF EXISTS public.leads
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_leads_leg_type ON public.leads(leg_type);

-- 3. contracts
ALTER TABLE IF EXISTS public.contracts
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_contracts_leg_type ON public.contracts(leg_type);

-- 4. payments
ALTER TABLE IF EXISTS public.payments
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_payments_leg_type ON public.payments(leg_type);

-- 5. revenue_records
ALTER TABLE IF EXISTS public.revenue_records
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_revenue_records_leg_type ON public.revenue_records(leg_type);

-- 6. expenses
ALTER TABLE IF EXISTS public.expenses
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_expenses_leg_type ON public.expenses(leg_type);

-- 7. projects
ALTER TABLE IF EXISTS public.projects
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_projects_leg_type ON public.projects(leg_type);

-- 8. courses
ALTER TABLE IF EXISTS public.courses
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_courses_leg_type ON public.courses(leg_type);

-- 9. knowledge_docs
ALTER TABLE IF EXISTS public.knowledge_docs
  ADD COLUMN IF NOT EXISTS leg_type TEXT NOT NULL DEFAULT 'other'
    CHECK (leg_type IN ('esg_dei', 'gov_tender', 'inclusion_bpo', 'academy', 'personal_ip', 'mixed', 'other'));
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_leg_type ON public.knowledge_docs(leg_type);

-- ============================================================
-- 跑完後驗證：每張表應該都有 leg_type 欄位、所有舊資料 = 'other'
-- ============================================================
-- SELECT 'organizations' AS table_name, leg_type, COUNT(*) FROM organizations GROUP BY leg_type
-- UNION ALL SELECT 'leads', leg_type, COUNT(*) FROM leads GROUP BY leg_type
-- UNION ALL SELECT 'contracts', leg_type, COUNT(*) FROM contracts GROUP BY leg_type
-- UNION ALL SELECT 'payments', leg_type, COUNT(*) FROM payments GROUP BY leg_type
-- UNION ALL SELECT 'revenue_records', leg_type, COUNT(*) FROM revenue_records GROUP BY leg_type
-- UNION ALL SELECT 'expenses', leg_type, COUNT(*) FROM expenses GROUP BY leg_type
-- UNION ALL SELECT 'projects', leg_type, COUNT(*) FROM projects GROUP BY leg_type
-- UNION ALL SELECT 'courses', leg_type, COUNT(*) FROM courses GROUP BY leg_type
-- UNION ALL SELECT 'knowledge_docs', leg_type, COUNT(*) FROM knowledge_docs GROUP BY leg_type;

-- 預期看到：每張表都列在結果裡、所有 row 的 leg_type 都是 'other'
