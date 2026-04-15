-- =============================================
-- 現金盤點記錄
-- =============================================

create table public.cash_reconciliations (
  id uuid primary key default gen_random_uuid(),
  reconciliation_date date not null,
  opening_balance integer not null default 0,
  cash_in integer not null default 0,
  cash_out integer not null default 0,
  expected_balance integer not null,
  actual_balance integer not null,
  variance integer not null,
  reconciled_by uuid references public.profiles(id),
  notes text,
  status text not null default '未結' check (status in ('未結', '已結', '異常')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_cash_date on public.cash_reconciliations(reconciliation_date desc);
create index idx_cash_status on public.cash_reconciliations(status);

create trigger on_cash_recon_update
  before update on public.cash_reconciliations
  for each row execute function public.handle_updated_at();

alter table public.cash_reconciliations enable row level security;
create policy "Authenticated can read cash_reconciliations" on public.cash_reconciliations for select to authenticated using (true);
create policy "Admin/operator can insert cash_reconciliations" on public.cash_reconciliations for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update cash_reconciliations" on public.cash_reconciliations for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- 現金異動明細
create table public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  direction text not null check (direction in ('收入', '支出')),
  amount integer not null,
  category text not null check (category in ('客戶繳款', '零用金', '退款', '補充金', '其他')),
  description text,
  payment_id uuid references public.payments(id) on delete set null,
  expense_id uuid references public.expenses(id) on delete set null,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_cash_tx_date on public.cash_transactions(transaction_date);
create index idx_cash_tx_direction on public.cash_transactions(direction);

alter table public.cash_transactions enable row level security;
create policy "Authenticated can read cash_transactions" on public.cash_transactions for select to authenticated using (true);
create policy "Admin/operator can insert cash_transactions" on public.cash_transactions for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update cash_transactions" on public.cash_transactions for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
