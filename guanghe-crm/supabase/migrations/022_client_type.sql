-- Migration 022: 新增客戶類型欄位（對齊光合創學 PRD 2.0 五腳營運模型）
-- 建立時間：2026-05-13
-- 目的：為現有客戶系統加上業務分類能力，使 CRM 能對齊新的五腳營運模型
-- 設計原則：enum + string fallback，避免未來業務調整時被 schema 卡死
-- 風險：低 — 只加新欄位，不改既有欄位
-- rollback：在 023 寫 DROP COLUMN client_type；rollback 不會影響舊資料

-- ===========================================
-- 1. 在 organizations 加 client_type 欄位
-- ===========================================
-- 使用 TEXT + CHECK constraint 而非 ENUM type，方便未來增加新類型
-- 預設 'other'，舊資料不需 backfill

ALTER TABLE IF EXISTS organizations
  ADD COLUMN IF NOT EXISTS client_type TEXT NOT NULL DEFAULT 'other'
    CHECK (client_type IN (
      'borrow_address',   -- 借址登記（PRD 2.0 後降級，保留供既有資料使用）
      'coworking',        -- 共享工位／場地租借
      'esg_dei',          -- 第一腳：ESG/DEI 體驗訓練包
      'gov_tender',       -- 第二腳：政府身障就業標案
      'inclusion_bpo',    -- 第三腳：Inclusion BPO 數位後勤
      'academy',          -- 第四腳：AI×共融職能轉換學院
      'personal_ip',      -- 第五腳：光光個人 IP × 內訓
      'other'             -- 未分類／舊資料 fallback
    ));

-- 建索引方便依類型篩選
CREATE INDEX IF NOT EXISTS idx_organizations_client_type ON organizations(client_type);

-- ===========================================
-- 2. （可選）為現有借址客戶 backfill
-- ===========================================
-- 註解掉，等 review 確認後再執行
-- UPDATE organizations
--   SET client_type = 'borrow_address'
--   WHERE id IN (SELECT org_id FROM space_clients WHERE service_type = 'borrow_address');

-- ===========================================
-- 3. 註解：未來擴張預備
-- ===========================================
-- 如需新增類型：
--   ALTER TABLE organizations DROP CONSTRAINT organizations_client_type_check;
--   ALTER TABLE organizations ADD CONSTRAINT organizations_client_type_check
--     CHECK (client_type IN ('borrow_address', 'coworking', 'esg_dei', 'gov_tender',
--                            'inclusion_bpo', 'academy', 'personal_ip', 'new_type_here', 'other'));
-- 這份 migration 不執行 UPDATE，保留所有舊資料為 'other'，由前端 UI 引導使用者重新分類。
