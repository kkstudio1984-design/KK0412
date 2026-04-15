-- =============================================
-- 內部知識庫 / SOP
-- =============================================

create table public.knowledge_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('SOP流程', 'FAQ常見問題', '政策規範', '合規法遵', '系統操作', '其他')),
  tags text[] default '{}',
  content text not null, -- markdown
  is_pinned boolean not null default false,
  view_count integer not null default 0,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_knowledge_category on public.knowledge_docs(category);
create index idx_knowledge_pinned on public.knowledge_docs(is_pinned desc, updated_at desc);
create index idx_knowledge_title on public.knowledge_docs using gin (to_tsvector('simple', title));

create trigger on_knowledge_update
  before update on public.knowledge_docs
  for each row execute function public.handle_updated_at();

alter table public.knowledge_docs enable row level security;

create policy "Authenticated can read knowledge_docs" on public.knowledge_docs for select to authenticated using (true);
create policy "Admin/operator can insert knowledge_docs" on public.knowledge_docs for insert to authenticated
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/operator can update knowledge_docs" on public.knowledge_docs for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin can delete knowledge_docs" on public.knowledge_docs for delete to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 預設 SOP 文件（種子資料）

insert into public.knowledge_docs (title, category, tags, content, is_pinned) values
(
  '新客戶簽約 SOP',
  'SOP流程',
  array['客戶', '簽約', '借址登記'],
  E'# 新客戶簽約 SOP\n\n## 步驟一：初步詢問\n\n1. LINE / 電話 / 到訪登記基本資料\n2. 系統 → CRM 看板 → 「+ 新增客戶」\n3. 填寫：公司名稱、聯絡人、服務類型\n4. 卡片自動進入「初步詢問」階段\n\n## 步驟二：KYC 審核（借址登記）\n\n1. 拖拉卡片到「KYC 審核中」\n2. 進入客戶詳情頁\n3. 逐項完成 5 項 KYC：\n   - 商工登記\n   - 司法院裁判書\n   - 動產擔保\n   - Google 搜尋\n   - 實質受益人審查\n4. 收齊 7 項文件（借址）或 2 項（工位）\n\n## 步驟三：合約簽約\n\n1. 系統 → 客戶詳情 → 合約管理 → 「+ 新增合約」\n2. 預設**年繳** + **兩個月押金**\n3. 點 🖨 PDF 列印合約\n4. 客戶現場簽名 + 用印\n5. 提醒客戶簽署**個資同意書**（點 🖨 PDF）\n\n## 步驟四：正式啟用\n\n1. 收到押金後，合約狀態改「已收」\n2. 卡片移至「已簽約」\n3. 客戶入駐日期到後，改「服務中」\n4. 寄發「歡迎加入」Email（點客戶詳情 → 📧 寄信範本）\n',
  true
),
(
  '現金收款 SOP',
  'SOP流程',
  array['財務', '收款', '現金'],
  E'# 現金收款 SOP\n\n## 收款當下\n\n1. 確認金額、清點現金\n2. 系統 → 財務總覽 → 現金盤點\n3. 點「+ 記錄收支」\n   - 類型：**收入**\n   - 類別：**客戶繳款**\n   - 金額、說明（客戶名）\n4. 點 🖨 列印收據給客戶\n5. 現金放入零用金盒\n\n## 每日下班前盤點\n\n1. 清點零用金盒現金\n2. 系統 → 現金盤點 → 「盤點結帳」\n3. 輸入實際餘額\n4. 差異 ≥ NT$100 會標記「異常」，要附備註\n\n## 每週五存銀行\n\n1. 將超過 NT$3,000 的部分存入公司帳戶\n2. 系統記錄「+ 記錄收支」→ 支出 → 其他\n3. 留存存款收據\n',
  true
),
(
  '客戶逾期催收 SOP',
  'SOP流程',
  array['財務', '催收', '逾期'],
  E'# 客戶逾期催收 SOP\n\n系統會自動依逾期天數升級階段：\n\n| 逾期 | 升級階段 | 行政動作 |\n|------|---------|---------|\n| 7 天 | 提醒 | 寄 `payment_reminder` Email + LINE 提醒 |\n| 14 天 | 催告 | 寄 `payment_overdue` + 電話聯繫 |\n| 30 天 | 存證信函 | 列印催告函（紙本），掛號寄出 |\n| 60 天 | 退租啟動 | 啟動退租流程，準備沒收押金 |\n\n## 每週一例行檢查\n\n1. 儀表板 → 救火層 → 逾期收款\n2. 逐筆確認升級階段\n3. 系統會建議下一階段動作\n\n## Email 範本使用\n\n客戶詳情頁 → 📧 寄信範本 → 選對應範本 → 在 Gmail 開啟發送\n',
  false
),
(
  '法院文書處理 SOP',
  'SOP流程',
  array['借址登記', '法院', '緊急'],
  E'# 法院文書處理 SOP\n\n⚠️ **最高優先級** — 法院文書關乎客戶權益，務必當天處理。\n\n## 收件當日\n\n1. 簽收郵件（掛號）\n2. 系統 → 客戶詳情 → 信件代收 → 「+ 登記信件」\n3. 類型選**法院文書**\n4. 留存寄件單位、掛號編號\n5. 系統會自動**置頂標紅**\n\n## 通知客戶\n\n1. 當日內 LINE 或電話通知\n2. 留言模式（避免主動洩漏內容）：「您有一封法院文書待領取」\n3. 不透露案由（避免違反個資）\n\n## 領取登記\n\n1. 客戶本人或合法代理人\n2. 查驗身分證\n3. 系統將狀態改「已領取」\n\n## 未領取處理\n\n- 7 天後再次通知\n- 14 天後發最後通知（書面）\n- 21 天後系統自動標記「已退回」\n',
  true
),
(
  'KYC 異常處理',
  'FAQ常見問題',
  array['KYC', '合規'],
  E'# KYC 異常處理\n\n## 情境一：商工登記狀態異常\n\n- 公司「停業」或「解散」→ **拒絕簽約**\n- 公司資本額過小（< NT$10 萬）→ 需 admin override 並紀錄原因\n\n## 情境二：司法院裁判書有紀錄\n\n- 民事：通常可接受，但需評估\n- 刑事（詐欺、洗錢）→ **拒絕簽約**\n- 稅務相關（逃漏稅判決）→ 要求補充證明\n\n## 情境三：Google 搜尋負面\n\n- 一般投訴：可接受\n- 詐騙受害者舉報：深入查證\n- 新聞報導詐騙：**拒絕簽約**\n\n## 情境四：實質受益人無法確認\n\n- 境外公司持股：需提供境外公司董事名冊\n- 多層持股：追到最終自然人\n- 無法追查 → **拒絕簽約**（風險過高）\n\n## Override 流程\n\n1. admin 進入客戶詳情 → KYC\n2. 點「覆核」按鈕\n3. 填寫**詳細**原因（稽核用）\n4. 系統 audit log 會紀錄\n',
  false
),
(
  '客戶地址變更通知流程',
  '合規法遵',
  array['借址登記', '變更', '通知'],
  E'# 客戶地址變更通知流程\n\n當客戶公司變更資訊，商業中心有通知義務。\n\n## 需要通知的變更\n\n- 公司名稱變更\n- 負責人變更\n- 統一編號變更（罕見）\n- 地址變更（從本商業中心搬走時）\n\n## 通知對象\n\n| 變更類型 | 國稅局 | 商業司 | 金管會 |\n|---------|-------|--------|-------|\n| 地址變更 | ✓ | ✓ | - |\n| 名稱變更 | ✓ | ✓ | - |\n| 負責人變更 | ✓ | ✓ | ✓ (若需 KYC) |\n| 統編變更 | ✓ | ✓ | - |\n\n## 系統操作\n\n1. 客戶詳情 → 公司資料變更\n2. 「+ 記錄變更」\n3. 填寫舊值 → 新值\n4. 發文通知相關機關\n5. 勾選已通知機關\n6. 狀態改「已通知」→ 等回函「已確認」\n\n## 保存期限\n\n變更紀錄需保留 **5 年**以上（依營業稅法與商業會計法）。\n',
  false
),
(
  '如何使用 Cmd+K 全域搜尋',
  '系統操作',
  array['快捷鍵', '搜尋'],
  E'# 全域搜尋使用指南\n\n任何時候按 `Cmd+K`（Mac）或 `Ctrl+K`（PC）都可開啟全域搜尋。\n\n## 可以搜尋什麼\n\n- **客戶**：公司名稱、聯絡人、統一編號\n- **潛在客戶**：姓名、聯絡資訊\n- **專案**：專案名稱\n- **頁面**：導航到任何頁面\n\n## 鍵盤操作\n\n- `↑` `↓` 選擇項目\n- `Enter` 開啟\n- `ESC` 關閉\n\n## 搜尋技巧\n\n1. **只打公司前兩個字** — 例如「光明」就能找到「光明科技有限公司」\n2. **打統編** — 直接跳到公司\n3. **打頁面名稱** — 如「財務」跳到財務頁\n\n## 其他快捷鍵\n\n按 `?` 查看完整快捷鍵清單。\n',
  false
);
