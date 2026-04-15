-- =============================================
-- Email 範本系統
-- =============================================

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  template_key text not null unique, -- e.g. 'welcome', 'payment_reminder'
  category text not null check (category in ('客戶', '收款', '合約', 'KYC', '退場', '通用', '其他')),
  subject text not null,
  body text not null,
  variables text[] default '{}', -- ['{{client_name}}', '{{amount}}']
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_email_templates_category on public.email_templates(category);
create index idx_email_templates_active on public.email_templates(is_active);

create trigger on_email_templates_update
  before update on public.email_templates
  for each row execute function public.handle_updated_at();

alter table public.email_templates enable row level security;
create policy "Authenticated can read email_templates" on public.email_templates for select to authenticated using (true);
create policy "Admin/operator can insert email_templates" on public.email_templates for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update email_templates" on public.email_templates for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can delete email_templates" on public.email_templates for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));

-- 預設範本
insert into public.email_templates (name, template_key, category, subject, body, variables, description) values
(
  '歡迎加入三院',
  'welcome_new_client',
  '客戶',
  '歡迎 {{client_name}} 加入光合創學！',
  E'{{contact_name}} 您好，\n\n歡迎 {{client_name}} 加入光合創學三院空間！\n\n我們已為您開通 {{service_type}} 服務，方案為 {{plan}}，月費 NT${{monthly_fee}}。\n\n如有任何問題，歡迎隨時與我們聯繫。\n\n光合創學團隊敬上',
  array['{{client_name}}', '{{contact_name}}', '{{service_type}}', '{{plan}}', '{{monthly_fee}}'],
  '新客戶簽約完成後寄送'
),
(
  '繳款通知',
  'payment_reminder',
  '收款',
  '【光合創學】{{client_name}} 應繳款通知',
  E'{{contact_name}} 您好，\n\n提醒您，{{client_name}} 有一筆應繳款項：\n\n金額：NT${{amount}}\n應繳日期：{{due_date}}\n項目：{{service_type}}\n\n請於期限內完成繳款，如已完成請忽略此信。\n\n匯款資訊：\n銀行：XXX銀行 XXX分行\n帳號：XXXXXXXXXX\n戶名：光合創學有限公司\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{amount}}', '{{due_date}}', '{{service_type}}'],
  '應繳日期前 7 天寄送'
),
(
  '逾期催告',
  'payment_overdue',
  '收款',
  '【催告】{{client_name}} 款項逾期通知',
  E'{{contact_name}} 您好，\n\n您的款項已逾期 {{overdue_days}} 天：\n\n金額：NT${{amount}}\n原應繳日期：{{due_date}}\n\n請儘速於 {{deadline}} 前完成繳款，否則將依合約規定處理。\n\n如已完成繳款請來訊告知，謝謝您的配合。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{amount}}', '{{due_date}}', '{{overdue_days}}', '{{deadline}}'],
  '逾期 7 天後寄送'
),
(
  '合約即將到期',
  'contract_expiring',
  '合約',
  '【光合創學】{{client_name}} 合約即將到期',
  E'{{contact_name}} 您好，\n\n您的 {{contract_type}} 合約將於 {{end_date}} 到期（剩 {{days_left}} 天）。\n\n若您希望續約，請與我們聯繫討論續約方案。\n若不續約，請依合約規定提前通知並完成遷出手續。\n\n期待繼續為您服務。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{contract_type}}', '{{end_date}}', '{{days_left}}'],
  '合約到期前 30 天寄送'
),
(
  'KYC 文件要求',
  'kyc_documents_request',
  'KYC',
  '【光合創學】需要您補充 KYC 文件',
  E'{{contact_name}} 您好，\n\n依《洗錢防制法》規定，我們需要您補充以下 KYC 文件：\n\n{{missing_documents}}\n\n請於 7 日內提供，以利完成 KYC 審核作業。\n\n如有任何疑問，歡迎來電洽詢。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{missing_documents}}'],
  'KYC 文件缺失時寄送'
),
(
  '年度 KYC 覆核',
  'kyc_annual_review',
  'KYC',
  '【光合創學】{{client_name}} 年度 KYC 覆核通知',
  E'{{contact_name}} 您好，\n\n依《洗錢防制法》規定，借址登記客戶須每年重新審查實質受益人資料。\n\n您的公司 {{client_name}} 上次審查日期為 {{last_verified}}（已超過 365 天），請提供以下文件以便我們進行年度覆核：\n\n1. 最新的實質受益人聲明書\n2. 股東名冊（若有異動）\n3. 公司負責人變更證明（若有變更）\n\n請於 14 日內提供，感謝您的配合。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{last_verified}}'],
  '年度覆核到期時寄送'
),
(
  '退租流程啟動',
  'offboarding_started',
  '退場',
  '【光合創學】{{client_name}} 退租流程通知',
  E'{{contact_name}} 您好，\n\n我們已收到 {{client_name}} 的退租申請，退租流程已啟動。\n\n合約終止日：{{end_date}}\n地址遷出期限：{{migration_deadline}}（合約終止日 + 30 天）\n\n請於期限內完成以下事項：\n1. 向國稅局申請公司地址變更\n2. 完成最後一期款項繳納\n3. 清空信件及物品\n\n如有結算或押金相關事宜，會由專人與您聯繫。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{end_date}}', '{{migration_deadline}}'],
  '啟動退租流程後寄送'
),
(
  '地址未遷出提醒',
  'address_migration_reminder',
  '退場',
  '【緊急】{{client_name}} 地址未遷出通知',
  E'{{contact_name}} 您好，\n\n您的合約已於 {{end_date}} 到期，但您的公司登記地址仍設於本商業中心。\n\n已逾期 {{overdue_days}} 天未遷出。依合約規定：\n- 逾期 30 天以上：扣押金 50%\n- 逾期 60 天以上：全額沒收押金，並申請廢止公司登記\n\n請立即向國稅局及商業司辦理地址變更，並將變更證明回傳給我們。\n\n如有疑問請立即來電，謝謝。\n\n光合創學 敬上',
  array['{{client_name}}', '{{contact_name}}', '{{end_date}}', '{{overdue_days}}'],
  '逾期未遷地址時寄送'
);
