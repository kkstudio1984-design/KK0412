-- =============================================
-- M5 教育訓練模組
-- =============================================

-- ── Courses（課程）───────────────────────────

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course_type text not null check (course_type in ('同理心體驗', '企業培訓', 'AI工具工作坊', '夥伴內訓')),
  duration_hours float not null default 1,
  price integer not null default 0,
  max_participants integer not null default 30,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Course Sessions（場次）───────────────────

create table public.course_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  session_date date not null,
  start_time time,
  location text,
  org_id uuid references public.organizations(id),
  status text not null default '規劃中' check (status in ('規劃中', '報名中', '已額滿', '已結束', '已取消')),
  actual_participants integer,
  revenue integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Enrollments（報名）───────────────────────

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.course_sessions(id) on delete cascade,
  participant_name text not null,
  participant_email text,
  org_id uuid references public.organizations(id),
  payment_status text not null default '未付' check (payment_status in ('未付', '已付', '已退費')),
  created_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_courses_type on public.courses(course_type);
create index idx_sessions_course on public.course_sessions(course_id);
create index idx_sessions_date on public.course_sessions(session_date);
create index idx_sessions_status on public.course_sessions(status);
create index idx_enrollments_session on public.enrollments(session_id);

-- ── Triggers ────────────────────────────────

create trigger on_courses_update
  before update on public.courses
  for each row execute function public.handle_updated_at();
create trigger on_sessions_update
  before update on public.course_sessions
  for each row execute function public.handle_updated_at();

-- ── RLS ─────────────────────────────────────

alter table public.courses enable row level security;
alter table public.course_sessions enable row level security;
alter table public.enrollments enable row level security;

create policy "Authenticated users can read courses" on public.courses for select to authenticated using (true);
create policy "Authenticated users can read course_sessions" on public.course_sessions for select to authenticated using (true);
create policy "Authenticated users can read enrollments" on public.enrollments for select to authenticated using (true);

create policy "Admin/operator can insert courses" on public.courses for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update courses" on public.courses for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can insert course_sessions" on public.course_sessions for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update course_sessions" on public.course_sessions for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can insert enrollments" on public.enrollments for insert to authenticated with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update enrollments" on public.enrollments for update to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
