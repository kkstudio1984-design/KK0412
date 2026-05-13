-- Migration 023: 學員管理表（身障 AI 就業 skill 計畫專屬）
-- 建立時間：2026-05-13
-- 目的：承載 PRD「身障者 AI 就業 skill 計畫」的學員 A、B、C 完整檔案
-- 與 partners 表的差異：partners 是合作夥伴；students 是受訓學員（培訓中／實習中／執業中／離開）
-- 設計：保護隱私為先 — public_consent 控制公開露面案例使用權

create table public.students (
  id uuid primary key default gen_random_uuid(),

  -- 識別
  code text not null unique,                       -- 學員代碼：A, B, C, 2026-001 等
  display_name text not null,                      -- 對外稱呼（可為代稱）
  real_name text,                                  -- 本名（內部使用）
  preferred_pronoun text,                          -- 偏好的稱呼

  -- 基本個資
  age integer,
  gender text,
  contact_phone text,
  contact_email text,
  family_contact text,                             -- 家屬／緊急聯絡人

  -- 身障狀況
  disability_type text,                            -- 視障 / 聽障 / 肢障 / 心智 / 多重 ...
  disability_level text,                           -- 輕度 / 中度 / 重度 / 極重度
  disability_certificate_no text,                  -- 身障手冊號（合規用）

  -- 工作能力評估
  computer_skill_level integer check (computer_skill_level between 0 and 10),
  can_sit_hours integer,                           -- 一次可坐多久（小時）
  can_voice_communicate boolean,                   -- 是否能語音溝通
  typing_wpm integer,                              -- 打字速度（中文字/分）
  mobility_aids text,                              -- 使用的輔助設備（輪椅、語音輸入等）

  -- 心理狀態
  mental_stability text check (mental_stability in ('穩定', '普通', '需要關照')) default '普通',
  notes_mental text,

  -- 過往經驗
  past_work_experience text,

  -- 培訓進度
  training_progress_step integer default 0,         -- 12 週課程目前到第幾週
  ai_tools_learned text[] default array[]::text[],  -- 已會的 AI 工具列表
  skills_certified text[] default array[]::text[],  -- 已認證的 skill 列表

  -- 案例授權（**極重要**）
  public_consent boolean default false,             -- 是否同意公開作為案例（含照片、姓名、故事）
  work_output_consent boolean default false,        -- 是否同意工作成果用於 ESG 報告書素材
  consent_signed_at timestamptz,

  -- 期別與狀態
  cohort text,                                      -- 期別：2026-Q3、2026-Q4 等
  status text not null default '培訓中'
    check (status in ('培訓中', '實習中', '執業中', '暫停中', '離開')),

  -- 財務
  stipend_monthly integer default 0,                -- 培訓津貼（NT$/月）
  income_monthly_estimated integer default 0,       -- 估計月收入（執業後）

  -- 關聯
  assigned_mentor uuid references public.profiles(id), -- 指派的導師（光光或 Miu）
  related_partner_id uuid references public.partners(id), -- 若畢業後也成為 BPO 夥伴

  -- 時間戳
  joined_at date,                                   -- 加入培訓的日期
  graduated_at date,                                -- 結業日期
  left_at date,                                     -- 離開日期
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_status on public.students(status);
create index idx_students_cohort on public.students(cohort);
create index idx_students_code on public.students(code);

create trigger on_students_update
  before update on public.students
  for each row execute function public.handle_updated_at();

-- RLS：所有員工可讀，但只有 admin/operator 可改
alter table public.students enable row level security;

create policy "Authenticated can read students"
  on public.students for select
  to authenticated using (true);

create policy "Admin/operator can insert students"
  on public.students for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  );

create policy "Admin/operator can update students"
  on public.students for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator'))
  );

create policy "Only admin can delete students"
  on public.students for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 提示：第一位學員 A 由光光手動透過 Supabase Studio 或 /students/new (未來) 加入
-- 至少必填：code='A', display_name='學員 A', status='培訓中', cohort='2026-Q2'
