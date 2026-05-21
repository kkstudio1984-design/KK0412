-- Migration 027: kyc_checks 加 details jsonb 欄位
-- 建立時間：2026-05-22
-- 對應：P1-3 KYC 自動化、lib/kyc-auto.ts
-- 目的：存自動查詢回傳的 raw response（g0v 商工登記 JSON、司法院裁判書摘要等），
--      未來借址客戶若出包、details 是稽核時的「為什麼 KYC 當下放行」證據。

ALTER TABLE IF EXISTS public.kyc_checks
  ADD COLUMN IF NOT EXISTS details JSONB;

ALTER TABLE IF EXISTS public.kyc_checks
  ADD COLUMN IF NOT EXISTS auto_checked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE IF EXISTS public.kyc_checks
  ADD COLUMN IF NOT EXISTS data_source TEXT;

-- 索引：未來想找「自動查的 KYC」很常用
CREATE INDEX IF NOT EXISTS idx_kyc_checks_auto_checked ON public.kyc_checks(auto_checked) WHERE auto_checked = true;

-- ============================================================
-- 跑完後驗證
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='kyc_checks'
-- ORDER BY ordinal_position;
--
-- 預期看到原本 7 個欄位 + 新增 details / auto_checked / data_source 三個
