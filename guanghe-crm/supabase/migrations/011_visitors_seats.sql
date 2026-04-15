-- =============================================
-- 訪客登記 + 座位管理
-- =============================================

-- ── 訪客登記 ────────────────────────────────

create table public.visitor_logs (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null,
  visitor_phone text,
  visitor_company text,
  purpose text not null check (purpose in ('洽公', '參觀', '維修', '送貨', '面試', '其他')),
  host_client_id uuid references public.space_clients(id) on delete set null,
  host_partner_id uuid references public.partners(id) on delete set null,
  host_note text,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  seat_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_visitor_checkin on public.visitor_logs(check_in_time);
create index idx_visitor_checkout on public.visitor_logs(check_out_time);
create index idx_visitor_host_client on public.visitor_logs(host_client_id);

alter table public.visitor_logs enable row level security;
create policy "Authenticated can read visitors" on public.visitor_logs for select to authenticated using (true);
create policy "Admin/operator can insert visitors" on public.visitor_logs for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update visitors" on public.visitor_logs for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- ── 座位 ────────────────────────────────────

create table public.seats (
  id uuid primary key default gen_random_uuid(),
  seat_number text not null unique,
  zone text check (zone in ('開放區', '安靜區', '會議室', '吧台', '其他')),
  seat_type text not null default '共享' check (seat_type in ('固定', '共享', '會議室', '訪客')),
  capacity integer not null default 1,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_seats_active on public.seats(is_active);

alter table public.seats enable row level security;
create policy "Authenticated can read seats" on public.seats for select to authenticated using (true);
create policy "Admin/operator can insert seats" on public.seats for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update seats" on public.seats for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- ── 座位佔用記錄 ────────────────────────────

create table public.seat_occupancy (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references public.seats(id) on delete cascade,
  space_client_id uuid references public.space_clients(id) on delete set null,
  visitor_log_id uuid references public.visitor_logs(id) on delete set null,
  occupant_name text not null,
  occupant_type text not null check (occupant_type in ('客戶', '訪客', '夥伴', '其他')),
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  created_at timestamptz not null default now()
);

create index idx_occupancy_seat on public.seat_occupancy(seat_id);
create index idx_occupancy_checkout on public.seat_occupancy(check_out_time);
create index idx_occupancy_client on public.seat_occupancy(space_client_id);

alter table public.seat_occupancy enable row level security;
create policy "Authenticated can read occupancy" on public.seat_occupancy for select to authenticated using (true);
create policy "Admin/operator can insert occupancy" on public.seat_occupancy for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update occupancy" on public.seat_occupancy for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
