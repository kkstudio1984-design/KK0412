-- =============================================
-- 客訴/事件記錄模組
-- =============================================

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  incident_type text not null check (incident_type in ('客訴', '糾紛', '警示事件', '異常狀況', '其他')),
  severity text not null default '中' check (severity in ('低', '中', '高', '緊急')),
  title text not null,
  description text,
  reported_by uuid references public.profiles(id),
  occurred_at timestamptz not null default now(),
  status text not null default '處理中' check (status in ('處理中', '已解決', '已結案', '已撤回')),
  resolution text,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_incidents_client on public.incidents(space_client_id);
create index idx_incidents_status on public.incidents(status);
create index idx_incidents_severity on public.incidents(severity);
create index idx_incidents_occurred on public.incidents(occurred_at);

create trigger on_incidents_update
  before update on public.incidents
  for each row execute function public.handle_updated_at();

alter table public.incidents enable row level security;

create policy "Authenticated can read incidents" on public.incidents for select to authenticated using (true);

create policy "Admin/operator can insert incidents" on public.incidents for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update incidents" on public.incidents for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
