-- =============================================
-- M3 業務銷售模組
-- =============================================

-- ── Leads（潛在客戶）────────────────────────

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  contact_name text not null,
  contact_info text,
  channel text not null check (channel in ('BNI', '蒲公英', 'ESG企業', '線上分享會', '自來客', '轉介')),
  interest text not null check (interest in ('借址登記', '工位', '場地', '專案接案', '企業培訓', 'ESG贊助', '其他')),
  stage text not null default '初步接觸' check (stage in ('初步接觸', '需求確認', '報價中', '成交', '流失')),
  follow_up_date date,
  notes text,
  converted_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Sponsorships（ESG 贊助合約）─────────────

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tier text not null check (tier in ('種子級', '成長級', '共融級')),
  annual_amount integer not null,
  start_date date not null,
  end_date date not null,
  deliverables text,
  status text not null default '洽談中' check (status in ('洽談中', '已簽約', '執行中', '已到期')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_leads_stage on public.leads(stage);
create index idx_leads_org on public.leads(org_id);
create index idx_leads_follow_up on public.leads(follow_up_date);
create index idx_leads_channel on public.leads(channel);
create index idx_sponsorships_org on public.sponsorships(org_id);
create index idx_sponsorships_status on public.sponsorships(status);

-- ── Auto-update updated_at ──────────────────

create trigger on_leads_update
  before update on public.leads
  for each row execute function public.handle_updated_at();

create trigger on_sponsorships_update
  before update on public.sponsorships
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────

alter table public.leads enable row level security;
alter table public.sponsorships enable row level security;

-- Read
create policy "Authenticated users can read leads"
  on public.leads for select to authenticated using (true);

create policy "Authenticated users can read sponsorships"
  on public.sponsorships for select to authenticated using (true);

-- Write
create policy "Admin/operator can insert leads"
  on public.leads for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update leads"
  on public.leads for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert sponsorships"
  on public.sponsorships for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update sponsorships"
  on public.sponsorships for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
