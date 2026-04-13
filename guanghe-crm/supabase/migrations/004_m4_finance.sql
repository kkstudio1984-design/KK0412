-- =============================================
-- M4 完整財務模組
-- =============================================

-- ── 營收紀錄（匯總各模組收入）───────────────

create table public.revenue_records (
  id uuid primary key default gen_random_uuid(),
  source_module text not null check (source_module in ('M1空間', 'M2專案', 'M3贊助', 'M5培訓')),
  source_id uuid,
  amount integer not null,
  revenue_date date not null,
  category text not null check (category in ('借址', '工位', '場地', '專案', '培訓', '贊助', '其他')),
  status text not null default '未收' check (status in ('已收', '未收', '逾期')),
  description text,
  created_at timestamptz not null default now()
);

-- ── 政府補助追蹤 ────────────────────────────

create table public.subsidy_tracking (
  id uuid primary key default gen_random_uuid(),
  subsidy_name text not null,
  agency text not null,
  annual_amount integer not null,
  application_status text not null default '未申請' check (application_status in ('未申請', '已申請', '審核中', '核准', '駁回')),
  disbursement_status text not null default '未撥款' check (disbursement_status in ('未撥款', '部分撥款', '全額撥款')),
  related_partners text[] default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 費用紀錄 ────────────────────────────────

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('租金', '水電', '人事', '設備', '行銷', '其他')),
  amount integer not null,
  expense_date date not null,
  description text not null,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_revenue_date on public.revenue_records(revenue_date);
create index idx_revenue_module on public.revenue_records(source_module);
create index idx_revenue_category on public.revenue_records(category);
create index idx_subsidy_status on public.subsidy_tracking(application_status);
create index idx_expenses_date on public.expenses(expense_date);
create index idx_expenses_category on public.expenses(category);

-- ── Auto-update updated_at ──────────────────

create trigger on_subsidy_update
  before update on public.subsidy_tracking
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────

alter table public.revenue_records enable row level security;
alter table public.subsidy_tracking enable row level security;
alter table public.expenses enable row level security;

-- Read
create policy "Authenticated users can read revenue_records"
  on public.revenue_records for select to authenticated using (true);
create policy "Authenticated users can read subsidy_tracking"
  on public.subsidy_tracking for select to authenticated using (true);
create policy "Authenticated users can read expenses"
  on public.expenses for select to authenticated using (true);

-- Write
create policy "Admin/operator can insert revenue_records"
  on public.revenue_records for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update revenue_records"
  on public.revenue_records for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert subsidy_tracking"
  on public.subsidy_tracking for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update subsidy_tracking"
  on public.subsidy_tracking for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert expenses"
  on public.expenses for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update expenses"
  on public.expenses for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can delete expenses"
  on public.expenses for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
