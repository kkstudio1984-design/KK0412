-- Migration 025: 電子發票 invoices 表
-- 建立時間：2026-05-21
-- 對應：P0-3 上線前優化清單、lib/invoice.ts wrapper
-- 目的：承載綠界電子發票（ECPay B2C / B2B）開立、作廢、查詢的所有紀錄
-- 設計：跟 email_logs 類似的「audit 表」設計 — issued / failed / skipped 三狀態都寫入，方便事後追蹤
-- 風險：低，純新建表

create table public.invoices (
  id uuid primary key default gen_random_uuid(),

  -- 綠界回傳資訊
  invoice_number text unique,                       -- 發票號碼（綠界配發、例如 AB12345678）
  invoice_date text,                                -- 發票開立日期 yyyy/MM/dd（綠界回傳格式）

  -- 對應 CRM 物件
  related_table text,                               -- 來源表名稱（contracts / payments / orders 等）
  related_id uuid,                                  -- 來源 row id（不加 FK 因為跨多表）

  -- 買受人資訊（快照、避免來源 row 改名後對不上）
  customer_name text not null,
  customer_identifier text,                         -- 統一編號（B2B），B2C 留空
  customer_address text,
  customer_email text,
  carrier_type text,                                -- 載具類型
  carrier_num text,

  -- 金額（含稅金額）
  amount integer not null,                          -- 銷售總額（含稅）
  tax_amount integer not null default 0,            -- 稅額（應稅 5%）
  tax_type text not null default '1'                -- 1 應稅、2 零稅、3 免稅
    check (tax_type in ('1', '2', '3')),

  -- 狀態
  status text not null default 'pending'
    check (status in ('pending', 'issued', 'failed', 'skipped', 'invalidated')),
  invalidated_at timestamptz,                       -- 作廢時間
  invalidated_reason text,

  -- 綠界 raw response（debugging 用）
  ecpay_response jsonb,
  error_message text,

  -- 時間戳
  issued_at timestamptz,                            -- 開立成功時間（lib/invoice.ts 寫入）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_invoices_status on public.invoices(status);
create index idx_invoices_related on public.invoices(related_table, related_id);
create index idx_invoices_customer_id on public.invoices(customer_identifier) where customer_identifier is not null;
create index idx_invoices_created_at on public.invoices(created_at desc);

create trigger on_invoices_update
  before update on public.invoices
  for each row execute function public.handle_updated_at();

-- RLS：所有員工可讀、僅 admin/operator 可寫（lib/invoice.ts 走 server-side 用 service role、繞 RLS）
alter table public.invoices enable row level security;

create policy "Authenticated can read invoices"
  on public.invoices for select
  to authenticated using (true);

create policy "Admin/operator can insert invoices"
  on public.invoices for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  );

create policy "Admin/operator can update invoices"
  on public.invoices for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  );

create policy "Only admin can delete invoices"
  on public.invoices for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 跑完後驗證
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='invoices'
-- ORDER BY ordinal_position;
--
-- 預期看到 20 個欄位
