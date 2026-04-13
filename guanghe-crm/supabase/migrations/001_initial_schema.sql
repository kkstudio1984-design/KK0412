-- =============================================
-- 光合創學 OMS - Initial Schema (Phase 1 MVP)
-- =============================================

-- ── 共用資料層 ──────────────────────────────

-- 使用者 profiles（關聯 Supabase auth.users）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role text not null default 'viewer' check (role in ('admin', 'operator', 'viewer', 'partner')),
  created_at timestamptz not null default now()
);

-- 組織（客戶/合作夥伴）
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  contact_name text not null,
  contact_phone text,
  contact_email text,
  contact_line text,
  representative_address text,
  representative_id_number text,
  org_type text not null default '客戶' check (org_type in ('客戶', '合作夥伴', '贊助企業', '政府單位')),
  source text not null default '其他' check (source in ('LINE表單', 'BNI轉介', '記帳師轉介', '蒲公英', 'ESG', '自來客', '其他')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 身障夥伴
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  name text not null,
  disability_type text,
  disability_level text check (disability_level in ('輕度', '中度', '重度', '極重度')),
  skill_level text default '基礎' check (skill_level in ('基礎', '中階', '進階')),
  skills text[] default '{}',
  employment_type text check (employment_type in ('按月計酬', '按件計酬')),
  onboarded_at date,
  status text not null default '培訓中' check (status in ('在職', '培訓中', '離職')),
  created_at timestamptz not null default now()
);

-- ── M1 空間營運 ─────────────────────────────

-- 空間客戶
create table public.space_clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  service_type text not null check (service_type in ('借址登記', '共享工位', '場地租借')),
  plan text,
  monthly_fee integer not null default 0,
  stage text not null default '初步詢問' check (stage in ('初步詢問', 'KYC審核中', '已簽約', '服務中', '退租中', '已結案', '已流失')),
  next_action text,
  follow_up_date date,
  red_flags text[] default '{}',
  is_disability_partner boolean not null default false,
  lost_reason text,
  lost_at timestamptz,
  is_high_risk_kyc boolean not null default false,
  blacklist_flag boolean not null default false,
  beneficial_owner_name text,
  beneficial_owner_verified_at timestamptz,
  assigned_seats integer not null default 1,
  access_cards_issued integer not null default 0,
  access_card_numbers text[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- KYC 查核
create table public.kyc_checks (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  check_type text not null check (check_type in ('商工登記', '司法院裁判書', '動產擔保', 'Google搜尋', '實質受益人審查')),
  status text not null default '待查' check (status in ('通過', '異常', '待查')),
  override_reason text,
  checked_at timestamptz not null default now()
);

-- 客戶文件檢核
create table public.client_documents (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  document_type text not null,
  required boolean not null default true,
  status text not null default '未繳' check (status in ('未繳', '已繳', '待補正')),
  submitted_at timestamptz,
  notes text
);

-- 合約
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  contract_type text not null check (contract_type in ('借址登記', '共享工位', '場地租借')),
  payment_cycle text not null default '年繳' check (payment_cycle in ('月繳', '季繳', '半年繳', '年繳')),
  start_date date not null,
  end_date date not null,
  monthly_rent integer not null,
  deposit_amount integer not null default 0,
  deposit_status text not null default '未收' check (deposit_status in ('未收', '已收', '已退')),
  is_notarized boolean not null default false,
  notarized_at timestamptz
);

-- 收款
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  contract_id uuid references public.contracts(id),
  due_date date not null,
  amount integer not null,
  status text not null default '未收' check (status in ('已收', '未收', '逾期')),
  paid_at timestamptz,
  escalation_level text not null default '正常' check (escalation_level in ('正常', '提醒', '催告', '存證信函', '退租啟動')),
  escalation_updated_at timestamptz,
  created_at timestamptz not null default now()
);

-- 信件代收
create table public.mail_records (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  received_date date not null,
  mail_type text not null check (mail_type in ('掛號', '平信', '法院文書')),
  tracking_number text,
  sender text not null,
  pickup_status text not null default '待領取' check (pickup_status in ('待領取', '已領取', '已退回')),
  notified_at timestamptz,
  final_notice_at timestamptz,
  picked_up_at timestamptz
);

-- 退租追蹤
create table public.offboarding_records (
  id uuid primary key default gen_random_uuid(),
  space_client_id uuid not null references public.space_clients(id) on delete cascade,
  request_date date not null,
  contract_end_date date not null,
  early_termination boolean not null default false,
  penalty_amount integer,
  settlement_status text not null default '待結算' check (settlement_status in ('待結算', '已結算')),
  address_migration_status text not null default '待遷出' check (address_migration_status in ('待遷出', '已通知', '逾期未遷', '已確認遷出')),
  migration_deadline date not null,
  migration_confirmed_at timestamptz,
  deposit_refund_status text not null default '待退' check (deposit_refund_status in ('待退', '部分扣抵', '已退', '全額沒收')),
  deposit_refund_amount integer,
  deposit_deduction_reason text,
  status text not null default '進行中' check (status in ('進行中', '已結案')),
  closed_at timestamptz
);

-- 操作軌跡
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  table_name text not null,
  record_id uuid not null,
  field_name text not null,
  old_value text,
  new_value text,
  changed_at timestamptz not null default now()
);

-- ── 索引 ────────────────────────────────────

create index idx_space_clients_org on public.space_clients(org_id);
create index idx_space_clients_stage on public.space_clients(stage);
create index idx_kyc_checks_client on public.kyc_checks(space_client_id);
create index idx_payments_client on public.payments(space_client_id);
create index idx_payments_status on public.payments(status);
create index idx_payments_due on public.payments(due_date);
create index idx_contracts_client on public.contracts(space_client_id);
create index idx_mail_records_client on public.mail_records(space_client_id);
create index idx_audit_logs_record on public.audit_logs(table_name, record_id);

-- ── Auto-update updated_at ──────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_organizations_update
  before update on public.organizations
  for each row execute function public.handle_updated_at();

create trigger on_space_clients_update
  before update on public.space_clients
  for each row execute function public.handle_updated_at();

-- ── Auto-create profile on signup ───────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    'viewer'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS Policies ────────────────────────────

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.partners enable row level security;
alter table public.space_clients enable row level security;
alter table public.kyc_checks enable row level security;
alter table public.client_documents enable row level security;
alter table public.contracts enable row level security;
alter table public.payments enable row level security;
alter table public.mail_records enable row level security;
alter table public.offboarding_records enable row level security;
alter table public.audit_logs enable row level security;

-- All authenticated users can read all data
create policy "Authenticated users can read profiles"
  on public.profiles for select to authenticated using (true);

create policy "Authenticated users can read organizations"
  on public.organizations for select to authenticated using (true);

create policy "Authenticated users can read partners"
  on public.partners for select to authenticated using (true);

create policy "Authenticated users can read space_clients"
  on public.space_clients for select to authenticated using (true);

create policy "Authenticated users can read kyc_checks"
  on public.kyc_checks for select to authenticated using (true);

create policy "Authenticated users can read client_documents"
  on public.client_documents for select to authenticated using (true);

create policy "Authenticated users can read contracts"
  on public.contracts for select to authenticated using (true);

create policy "Authenticated users can read payments"
  on public.payments for select to authenticated using (true);

create policy "Authenticated users can read mail_records"
  on public.mail_records for select to authenticated using (true);

create policy "Authenticated users can read offboarding_records"
  on public.offboarding_records for select to authenticated using (true);

create policy "Authenticated users can read audit_logs"
  on public.audit_logs for select to authenticated using (true);

-- Admin and operator can write
create policy "Admin/operator can insert organizations"
  on public.organizations for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update organizations"
  on public.organizations for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert space_clients"
  on public.space_clients for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update space_clients"
  on public.space_clients for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert kyc_checks"
  on public.kyc_checks for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update kyc_checks"
  on public.kyc_checks for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert client_documents"
  on public.client_documents for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update client_documents"
  on public.client_documents for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert contracts"
  on public.contracts for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update contracts"
  on public.contracts for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert payments"
  on public.payments for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update payments"
  on public.payments for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert mail_records"
  on public.mail_records for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update mail_records"
  on public.mail_records for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can insert offboarding_records"
  on public.offboarding_records for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

create policy "Admin/operator can update offboarding_records"
  on public.offboarding_records for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- Audit logs: anyone authenticated can insert (system writes on behalf of user)
create policy "Authenticated can insert audit_logs"
  on public.audit_logs for insert to authenticated
  with check (true);

-- Admin can update profiles (role management)
create policy "Admin can update profiles"
  on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
