-- =============================================
-- P2: 夥伴薪資 + 補助出勤 + 客戶變更通知
-- =============================================

-- ── 出勤記錄（身障夥伴）─────────────────────

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  subsidy_id uuid references public.subsidy_tracking(id) on delete set null,
  attendance_date date not null,
  check_in_time time,
  check_out_time time,
  hours_worked float,
  activity text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_attendance_partner on public.attendance_records(partner_id);
create index idx_attendance_date on public.attendance_records(attendance_date);
create index idx_attendance_subsidy on public.attendance_records(subsidy_id);

alter table public.attendance_records enable row level security;

create policy "Authenticated can read attendance" on public.attendance_records for select to authenticated using (true);
create policy "Admin/operator can insert attendance" on public.attendance_records for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update attendance" on public.attendance_records for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- ── 客戶變更通知 ────────────────────────────

create table public.change_notifications (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  change_type text not null check (change_type in ('地址變更', '負責人變更', '名稱變更', '統編變更', '其他')),
  old_value text,
  new_value text,
  notified_agencies text[] default '{}',
  notification_status text not null default '待通知' check (notification_status in ('待通知', '已通知', '已確認', '不需通知')),
  notified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_change_client on public.change_notifications(space_client_id);
create index idx_change_status on public.change_notifications(notification_status);

create trigger on_change_notif_update
  before update on public.change_notifications
  for each row execute function public.handle_updated_at();

alter table public.change_notifications enable row level security;

create policy "Authenticated can read change_notifications" on public.change_notifications for select to authenticated using (true);
create policy "Admin/operator can insert change_notifications" on public.change_notifications for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update change_notifications" on public.change_notifications for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- ── 擴充 partner_earnings 用於審批流程 ───────

alter table public.partner_earnings
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists description text,
  add column if not exists period_month text; -- format: YYYY-MM
