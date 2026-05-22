-- Migration 026: 合約簽署 audit trail（P1-1 電子簽章法合規預備）
-- 建立時間：2026-05-21
-- 目的：每次簽署事件留 immutable 紀錄，含合約內容 hash + 簽名圖 hash + timestamp + IP + UA，
--      未來借址客戶若跑路、合約上法院時可用 audit log 佐證「簽名當下合約內容是這個版本」、
--      不會被質疑事後修改。
-- 設計：append-only，沒有 update / delete policy，admin 也不能改。

create table public.contract_signing_audit (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,

  -- 簽署事件本身
  event_type text not null check (event_type in ('signed', 'rejected', 'viewed', 'resent')),
  signed_at timestamptz not null default now(),

  -- 簽署人快照（不引用 profiles 表、保留簽署當下原樣）
  signer_name text,
  signer_ip text,
  signer_user_agent text,

  -- Hash chain — 簽署當下合約內容 + 簽名圖的 SHA-256
  -- contract_snapshot_hash: lib/contract-audit.ts hashContract() 算出來的、整份合約欄位 stable JSON 之 SHA256 hex
  contract_snapshot_hash text,
  -- signature_image_hash: 簽名圖 base64 字串本身的 SHA256 hex
  signature_image_hash text,
  signature_image_size_bytes integer,

  -- 副情報
  reject_reason text,
  raw_payload jsonb,                                -- 整份 request payload 快照（debugging + 司法存證雙用）

  created_at timestamptz not null default now()
);

create index idx_contract_signing_audit_contract on public.contract_signing_audit(contract_id);
create index idx_contract_signing_audit_signed_at on public.contract_signing_audit(signed_at desc);
create index idx_contract_signing_audit_event_type on public.contract_signing_audit(event_type);

-- RLS：append-only 設計
alter table public.contract_signing_audit enable row level security;

create policy "Authenticated can read signing audit"
  on public.contract_signing_audit for select
  to authenticated using (true);

create policy "Server can insert signing audit"
  on public.contract_signing_audit for insert
  to authenticated
  with check (true);  -- 由 sign route 走 service role 或 authenticated 雙路徑都允許 insert

-- 故意不建 update / delete policy — append-only

-- ============================================================
-- 跑完後驗證
-- ============================================================
-- SELECT count(*) AS col_count FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='contract_signing_audit';
--
-- 預期 col_count = 12
