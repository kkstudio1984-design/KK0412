-- =============================================
-- M2 專案接案模組
-- =============================================

-- ── Projects（專案）─────────────────────────

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  project_type text not null check (project_type in ('AI影片', 'SEO配圖', '社群經營', '手心共影')),
  status text not null default '洽談中' check (status in ('洽談中', '進行中', '待驗收', '已結案', '已取消')),
  budget integer not null default 0,
  start_date date,
  deadline date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Tasks（任務）─────────────────────────────

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  partner_id uuid references public.partners(id),
  title text not null,
  status text not null default '待分配' check (status in ('待分配', '進行中', '待審核', '完成', '退回')),
  due_date date,
  output_url text,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Partner Earnings（夥伴酬勞）──────────────

create table public.partner_earnings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  task_id uuid references public.tasks(id),
  amount integer not null,
  status text not null default '待結算' check (status in ('待結算', '已累積', '已支付')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_projects_org on public.projects(org_id);
create index idx_projects_status on public.projects(status);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_partner on public.tasks(partner_id);
create index idx_tasks_status on public.tasks(status);
create index idx_partner_earnings_partner on public.partner_earnings(partner_id);
create index idx_partner_earnings_status on public.partner_earnings(status);

-- ── Auto-update updated_at ──────────────────

create trigger on_projects_update
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger on_tasks_update
  before update on public.tasks
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.partner_earnings enable row level security;

create policy "Authenticated users can read projects"
  on public.projects for select to authenticated using (true);
create policy "Authenticated users can read tasks"
  on public.tasks for select to authenticated using (true);
create policy "Authenticated users can read partner_earnings"
  on public.partner_earnings for select to authenticated using (true);

create policy "Admin/operator can insert projects"
  on public.projects for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update projects"
  on public.projects for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert tasks"
  on public.tasks for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update tasks"
  on public.tasks for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert partner_earnings"
  on public.partner_earnings for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update partner_earnings"
  on public.partner_earnings for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
