-- Migration 028: kyc_checks 加 UNIQUE constraint (space_client_id, check_type)
-- 建立時間：2026-06-17
-- 對應：lib/kyc-auto.ts atomic upsert fix
-- 目的：原本 runAutoKyc 用「先 delete 後 insert」確保 idempotency、
--      但 delete 成功 + insert 失敗（網路 / RLS / JSON 太大）會永久丟失客戶
--      既有 KYC 紀錄。加 UNIQUE constraint 後改用 upsert (onConflict:
--      space_client_id,check_type)、PostgreSQL 端原子保證、不會有丟資料風險。
--
-- 前置條件：執行前需確認 kyc_checks 表內無重複 (space_client_id, check_type)
--          組合的 row、否則 unique 加不上去、需先手動清理：
--
--   -- 找重複組合
--   SELECT space_client_id, check_type, COUNT(*) AS cnt
--   FROM public.kyc_checks
--   GROUP BY space_client_id, check_type
--   HAVING COUNT(*) > 1;
--
--   -- 若有、保留最新一筆、刪舊
--   DELETE FROM public.kyc_checks a
--   USING public.kyc_checks b
--   WHERE a.space_client_id = b.space_client_id
--     AND a.check_type = b.check_type
--     AND a.checked_at < b.checked_at;
--
-- 通常 production 還未跑 P0-2 / P1-3 KYC 自動化、表內可能為空或少量 row、衝突
-- 機率低。

ALTER TABLE IF EXISTS public.kyc_checks
  ADD CONSTRAINT kyc_checks_space_client_check_type_unique
  UNIQUE (space_client_id, check_type);

-- ============================================================
-- 跑完後驗證
-- ============================================================
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'public.kyc_checks'::regclass AND contype = 'u';
--
-- 預期看到 kyc_checks_space_client_check_type_unique UNIQUE (space_client_id, check_type)
