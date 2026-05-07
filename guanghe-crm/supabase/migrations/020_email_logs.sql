-- ── Migration 020: Email 寄送記錄 ──
-- 每次系統自動寄信都留一筆，用於排錯與稽核。
-- 紀錄受 RLS 保護，僅 admin/operator 可看。

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  to_name text,
  subject text not null,
  template_key text,                          -- 沿用哪個 email_templates.template_key
  body_preview text,                          -- 前 500 字摘要，避免完整 body 把表撐大
  related_table text,                         -- 觸發來源（contracts / payments / kyc / mail_records）
  related_id uuid,                            -- 對應到的 row id
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'skipped')),
  provider text default 'resend',             -- 預留將來換 service 的可能
  provider_message_id text,                   -- Resend 回傳的 message id
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_email_logs_status on public.email_logs(status);
create index idx_email_logs_related on public.email_logs(related_table, related_id);
create index idx_email_logs_created on public.email_logs(created_at desc);

alter table public.email_logs enable row level security;

create policy "Admin/operator can read email_logs"
  on public.email_logs for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- Service role / cron 可寫入（不限定 user）
create policy "System can insert email_logs"
  on public.email_logs for insert to authenticated
  with check (true);

create policy "System can update email_logs"
  on public.email_logs for update to authenticated
  using (true);

comment on table public.email_logs is
  'Persistent log of every outbound email triggered by the system (cron, manual sends, signing flows).';
