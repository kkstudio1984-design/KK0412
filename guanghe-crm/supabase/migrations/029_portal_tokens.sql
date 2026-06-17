-- Migration 029: portal_tokens 表 — 客戶自助 Portal magic link 機制
-- 建立時間：2026-06-17
-- 對應：P2-1 客戶自助 Portal、lib/portal-token.ts、/portal/[token] 頁
-- 目的：admin 為每個 space_client 產生一次性 URL、客戶用連結進來自己看
--      合約 / 繳款 / KYC / 月報預告，省人肉客服時間。

create table public.portal_tokens (
  -- 43 chars URL-safe random（crypto.randomBytes(32).toString('base64url')）
  token text primary key,

  -- 對應客戶
  space_client_id uuid not null references public.space_clients(id) on delete cascade,

  -- 有效期間
  expires_at timestamptz not null,
  first_accessed_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer not null default 0,

  -- 誰產生的、debugging 用
  created_by uuid references auth.users(id),
  notes text,                                -- admin 備註（例如「寄給嚴總 6/17」）

  created_at timestamptz not null default now()
);

create index idx_portal_tokens_space_client on public.portal_tokens(space_client_id);
-- 未過期 token 查詢索引（清理 cron 跟 admin UI 用）
create index idx_portal_tokens_active on public.portal_tokens(expires_at)
  where expires_at > now();

-- ── RLS ──────────────────────────────────────────────────────
-- portal_tokens 由 admin/operator 管理（產生、撤銷、列出）。
-- portal 頁面本身用 service-role client 讀（繞 RLS、因為訪客是 unauthenticated）。

alter table public.portal_tokens enable row level security;

create policy "Admin/operator can manage portal tokens"
  on public.portal_tokens for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  );

-- ============================================================
-- 跑完後驗證
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='portal_tokens'
-- ORDER BY ordinal_position;
--
-- 預期看到 9 個欄位 + 2 個索引 + 1 個 RLS policy
