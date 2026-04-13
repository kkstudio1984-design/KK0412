-- =============================================
-- M6 AI 戰略模組
-- =============================================

-- ── AI Tools（AI 工具清單）──────────────────

create table public.ai_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text,
  used_by_modules text[] default '{}',
  cost_monthly integer,
  status text not null default '使用中' check (status in ('使用中', '評估中', '已棄用')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Training Records（夥伴培訓紀錄）─────────

create table public.training_records (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  training_type text not null check (training_type in ('基礎班', '進階班', '專項培訓')),
  tool_name text,
  completed_at date,
  status text not null default '未開始' check (status in ('未開始', '進行中', '已完成')),
  assessment_score integer,
  created_at timestamptz not null default now()
);

-- ── Agents（AI Agent 管理）──────────────────

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  purpose text,
  target_module text,
  prompt_version text,
  last_updated date,
  performance_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_ai_tools_status on public.ai_tools(status);
create index idx_training_records_partner on public.training_records(partner_id);
create index idx_training_records_status on public.training_records(status);
create index idx_agents_module on public.agents(target_module);

-- ── Triggers ────────────────────────────────

create trigger on_ai_tools_update before update on public.ai_tools for each row execute function public.handle_updated_at();
create trigger on_agents_update before update on public.agents for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────

alter table public.ai_tools enable row level security;
alter table public.training_records enable row level security;
alter table public.agents enable row level security;

create policy "Authenticated users can read ai_tools" on public.ai_tools for select to authenticated using (true);
create policy "Authenticated users can read training_records" on public.training_records for select to authenticated using (true);
create policy "Authenticated users can read agents" on public.agents for select to authenticated using (true);

create policy "Admin/operator can insert ai_tools" on public.ai_tools for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update ai_tools" on public.ai_tools for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can insert training_records" on public.training_records for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update training_records" on public.training_records for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can insert agents" on public.agents for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update agents" on public.agents for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
