-- ============================================================
-- 學員 A 入庫範例（students 表）
-- ============================================================
-- 用途：在 migration 023_students.sql 跑完之後，跑這份 SQL 把第一位
--      學員 A 加進系統，順手測 RLS 通不通、列表頁是否正確渲染。
--
-- ⚠️ 跑之前請光光：
--   1. 填上你心裡學員 A 的真實狀況（替換下方所有 <填> 標籤）
--   2. 確認 public_consent 與 work_output_consent 都是 false（除非你已經拿到簽署）
--   3. 確認 assigned_mentor 是你或 Miu 的 profile.id（從 profiles 表查）
-- ============================================================

-- 先確認你有 admin/operator 角色（RLS 才會放行 INSERT）
-- SELECT id, role FROM profiles WHERE id = auth.uid();

-- 學員 A：保守版（最小欄位、可立刻跑）
INSERT INTO public.students (
  code,
  display_name,
  status,
  cohort,
  training_progress_step,
  mental_stability,
  public_consent,
  work_output_consent,
  notes
) VALUES (
  'A',
  '學員 A',
  '培訓中',
  '2026-Q2',
  0,
  '穩定',
  false,
  false,
  '光光現有培養中的第一位身障朋友。具體狀況以 PRD §1.1 為準。授權書未簽。'
);

-- ============================================================
-- 學員 A：完整版（光光填好真實狀況後用這份替代上面的保守版）
-- ============================================================
-- INSERT INTO public.students (
--   code, display_name, real_name, preferred_pronoun,
--   age, gender, contact_phone, contact_email, family_contact,
--   disability_type, disability_level, disability_certificate_no,
--   computer_skill_level, can_sit_hours, can_voice_communicate, typing_wpm, mobility_aids,
--   mental_stability, notes_mental,
--   past_work_experience,
--   training_progress_step, ai_tools_learned, skills_certified,
--   public_consent, work_output_consent, consent_signed_at,
--   cohort, status,
--   stipend_monthly, income_monthly_estimated,
--   assigned_mentor,
--   joined_at,
--   notes
-- ) VALUES (
--   'A',                            -- code
--   '<填：對外稱呼，例如「小明」或「學員 A」>',
--   '<填：本名>',
--   '<填：他／她／或其他偏好稱呼>',
--   <填：年齡（整數）>,
--   '<填：性別>',
--   '<填：聯絡電話>',
--   '<填：Email（可空）>',
--   '<填：家屬／緊急聯絡人 — 姓名與電話>',
--   '<填：身障類別（視障／聽障／肢障／心智／多重）>',
--   '<填：等級（輕度／中度／重度／極重度）>',
--   '<填：身障手冊號（可空）>',
--   <填：電腦操作熟練度 0-10>,
--   <填：一次可坐多久（小時整數）>,
--   <填：能否語音溝通 true/false>,
--   <填：打字速度（中文字/分整數）>,
--   '<填：使用的輔助設備>',
--   '<填：穩定／普通／需要關照>',
--   '<填：心理狀態備註>',
--   '<填：過往工作經驗描述>',
--   <填：12 週課程目前在第幾週（0-12）>,
--   ARRAY['<填：已會的 AI 工具 1>', '<填：已會的 AI 工具 2>']::text[],
--   ARRAY[]::text[],                -- skills_certified 培訓初期為空
--   <填：是否已同意公開作為案例 true/false>,
--   <填：是否已同意工作成果用於 ESG 報告書 true/false>,
--   <填：授權書簽署時間（timestamp，可空，例如 now() 或 '2026-05-13'）>,
--   '2026-Q2',                      -- cohort
--   '培訓中',
--   <填：培訓津貼月額（整數，無則 0）>,
--   0,                              -- 培訓期估計月收 0
--   '<填：指派導師的 profile.id（從 profiles 查）>'::uuid,
--   '<填：加入培訓的日期（例如 2026-05-13）>'::date,
--   '<填：其他備註>'
-- );

-- ============================================================
-- 跑完後驗證
-- ============================================================
SELECT code, display_name, status, cohort, training_progress_step, mental_stability
FROM public.students
WHERE code = 'A';

-- 預期看到一筆「學員 A / 培訓中 / 2026-Q2 / W0 / 穩定」
