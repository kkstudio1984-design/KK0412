# guanghe-crm 新架構藍圖 v0.2（五腳對齊版）

> 建立日期：2026-05-13
> 性質：未來設計（藍圖），不是現況
> 上游：`CRM-architecture-v0.1.md`（現況盤點）+ `CRM-realign-PRD-v0.1.md`（重構 PRD）
> 設計原則：以 v0.1 盤點為事實基礎，把 v1 既有資產用滿、不重做

---

## 〇、藍圖設計的三條鐵律

| 鐵律 | 含義 |
|------|------|
| **保留為主、新增為輔** | 35 張表保留 30 張、改欄位 4 張、新增 4-6 張（總數 39-41） |
| **資訊架構從「模組」轉成「業務腳」** | UI 一級導航重組成五腳並行，內部還是同一份 code |
| **不為還沒進場的業務寫 code** | 第二腳標案、第三腳 BPO 的詳細模組等業務到了再做 — 藍圖只佔位 |

---

## 一、UI 資訊架構重組（最重要的一件事）

### 1.1 v1 的問題

v1 的一級導航是「按系統模組分」（M1 空間 / M2 專案 / M3 銷售 / M4 財務 / M5 訓練 / M6 AI），這是**工程師思維**。但老闆每天不是想「我要去 M3」，是想「**今天的 ESG 訓練包進度到哪？我的政府標案還有幾個沒投？**」。

### 1.2 v2 的新主導航

| 一級分類 | 對應五腳 | 內含現有頁面 |
|---------|---------|------------|
| **🏠 戰情** | 通用 | dashboard、calendar、reports |
| **💎 ESG 訓練包** | 第一腳 | sales/sponsorships、leads（filter: esg_dei）、contracts（filter: esg_dei） |
| **🏛️ 政府標案** | 第二腳 | （新模組 `/tenders`） |
| **♿ 共融夥伴** | 第三腳 | partners（擴張）、空間裡的 BPO 月費追蹤 |
| **🎓 AI 共融學院** | 第四腳 | training/courses、enrollments、產投補助流程 |
| **🎤 個人 IP** | 第五腳 | projects（filter: personal_ip 內訓案）、knowledge |
| **💰 收支與合約** | 全腳共用 | finance、contracts、payments |
| **📚 知識庫** | 全腳共用 | knowledge_docs |
| **⚙️ 管理** | 系統 | admin、audit、users、email-templates、停用模組 |

**核心轉變**：從「看到 12 個技術模組」變成「看到 5 條業務線 + 3 個共用工具 + 1 個管理區」。**老闆會立刻知道每條業務線在哪裡**。

### 1.3 哪些舊模組消失到管理區或被刪

| 模組 | 處置 |
|------|------|
| `/address-risk` | 已從導航拿掉（v0.1 階段一） |
| `/seats` | 降到管理區（v0.1 階段一） |
| `/sales` 主頁 | **拆解**到「ESG 訓練包」、「政府標案」、「共融夥伴」、「個人 IP」四條腳的子 leads |
| `/visitors` | 留著，但放進「戰情」一級下，跟 calendar 整合 |
| `/ai-strategy` | 改名「AI 共融學院內部」，放進第四腳，當作學院的內容素材庫 |

---

## 二、資料層改造

### 2.1 35 張表的命運表

| 表 | 處置 | 原因 |
|----|------|------|
| profiles | 🟢 保留 | 五腳共用 |
| organizations | 🟢 保留（加 client_type、加更多五腳欄位） | 宇宙中心 |
| partners | 🟢 保留（擴張：加 partner_type、is_inclusion_member 欄位） | 第三腳基礎 |
| space_clients | 🟡 凍結（只讀、不再新增） | 借址專屬 |
| kyc_checks | 🟡 凍結 | 同上 |
| client_documents | 🟢 保留 | 五腳通用 |
| contracts | 🟢 保留（加 leg_type 欄位、補五腳範本） | 五腳通用 |
| payments | 🟢 保留（加 leg_type 欄位） | 五腳通用 |
| mail_records | 🟡 凍結 | 借址專屬 |
| offboarding_records | 🟢 保留 | 工位／長約客戶終止用 |
| audit_logs | 🟢 保留 | 全表共用 |
| leads | 🟢 保留（加 leg_type） | 五腳銷售管線共用 |
| sponsorships | 🟢 **拉到一級**（這是第一腳 ESG/DEI 入口） | 被埋住的金礦 |
| revenue_records | 🟢 保留（加 leg_type） | 財務分腳統計 |
| subsidy_tracking | 🟢 保留（擴張：細分政府／補助類型） | 第二、四腳要用 |
| expenses | 🟢 保留（加 leg_type） | 五腳分腳成本 |
| projects | 🟢 保留（加 leg_type） | 第五腳內訓、第一腳 ESG 案執行 |
| tasks | 🟢 保留 | projects 子表 |
| partner_earnings | 🟢 保留（擴張：補 BPO 月費邏輯） | 第三腳薪資基礎 |
| courses | 🟢 保留（加 funding_type：產投／業界委訓／自費） | 第四腳基礎 |
| course_sessions | 🟢 保留 | 同上 |
| enrollments | 🟢 保留（加 attendance_rate 欄位） | 產投補助需要出席率 |
| ai_tools | 🟢 保留（重定位為學院教材庫） | 第四腳內容素材 |
| training_records | 🟢 保留 | 第四腳 |
| agents | 🟢 保留 | 第四腳 / 內部 |
| notifications | 🟢 保留 | 通用 |
| incidents | 🟢 保留 | 通用 |
| attendance_records | 🟢 保留 | 第三腳 BPO 出勤 |
| change_notifications | 🟢 保留 | 通用 |
| visitor_logs | 🟢 保留 | 通用（活動報到） |
| seats | 🟡 凍結 | 工位招租降級 |
| seat_occupancy | 🟡 凍結 | 同上 |
| cash_reconciliations | 🟢 保留 | 通用 |
| cash_transactions | 🟢 保留 | 通用 |
| email_templates | 🟢 保留（擴張：補五腳範本） | 通用 |
| knowledge_docs | 🟢 保留（加 leg_type） | 通用 |
| email_logs | 🟢 保留 | 通用 |

**統計**：
- 🟢 保留／擴張：26 張
- 🟡 凍結（不刪）：5 張
- 🔴 刪除：0 張
- 新增（見下節）：4-6 張

### 2.2 新增的 4-6 張表（按優先級）

| 表 | 用途 | 優先級 | 何時做 |
|----|------|--------|--------|
| **tenders** | 政府標案主表 | 🔴 高 | 接到第一個標案前 |
| **tender_milestones** | 標案進度（投標 / 決標 / 履約 / 核銷） | 🔴 高 | 同上 |
| **tender_documents** | 投標相關文件 | 🟡 中 | 第二個標案時 |
| **bpo_assignments** | BPO 夥伴的指派、月費 | 🟡 中 | 第一位夥伴進場前 |
| **bpo_compliance_reports** | 身權法 38 條合規報告 | 🟢 低 | 真的有員工要報時 |
| **academy_subsidies** | 學院產投補助送件追蹤 | 🟢 低 | 真的送件時 |

### 2.3 跨腳通用的「五腳分類」欄位設計

**設計模式**：在 `organizations`、`leads`、`contracts`、`payments`、`revenue_records`、`expenses`、`projects`、`courses`、`knowledge_docs` 共 9 張表加同一個 `leg_type` 欄位（TEXT + CHECK constraint）。

| 值 | 中文 |
|-----|------|
| `esg_dei` | ESG/DEI 訓練包 |
| `gov_tender` | 政府標案 |
| `inclusion_bpo` | Inclusion BPO |
| `academy` | AI 共融學院 |
| `personal_ip` | 個人 IP / 內訓 |
| `mixed` | 跨腳（例如某筆收入跨兩腳） |
| `other` | 未分類 |

**核心好處**：未來只要做一個 `WHERE leg_type = 'esg_dei'` 的 query，整條第一腳的客戶／合約／收入／成本／案件全部串起來。**儀表板的五腳收入堆疊圖、五腳轉換率漏斗，全部由這一個欄位驅動**。

### 2.4 對應的 migration 計畫

| Migration | 內容 | 階段 |
|-----------|------|------|
| 022 | organizations.client_type（v0.1 已交付） | 階段一 ✅ |
| 023 | 9 張表加 leg_type（一次性、大改） | 階段二 |
| 024 | contracts、leads、revenue 的 5 腳分類 backfill SQL | 階段二 |
| 025 | tenders + tender_milestones | 階段五（業務進場） |
| 026 | tender_documents | 階段五延伸 |
| 027 | bpo_assignments | 階段六 |
| 028 | academy_subsidies | 階段七 |

---

## 三、API 層改造

### 3.1 設計原則

**不重寫現有 64 個端點**，只做兩種改動：

第一，**加 query param** 支援按 `leg_type` 篩選（例如 `/api/leads?leg_type=esg_dei`）。

第二，**新增 5 個 aggregated endpoint** 給儀表板使用：

| 新端點 | 用途 |
|--------|------|
| `/api/dashboard/legs-overview` | 五腳收入堆疊、本月貢獻比 |
| `/api/dashboard/cash-warning` | 現金水位 vs $73 萬警戒 |
| `/api/dashboard/breakeven-progress` | 本月實收 vs $182,520 損益平衡 |
| `/api/dashboard/contract-pipeline` | 五腳合約管線（即將到期、未到帳） |
| `/api/dashboard/personal-ip-events` | 第五腳內訓場次累積 |

### 3.2 新模組的 API（先佔位、不寫）

| 路徑 | 何時實作 |
|------|---------|
| `/api/tenders/...` | 接到第一個標案前 |
| `/api/bpo/...` | 第一位夥伴進場前 |
| `/api/academy/subsidies/...` | 真的送件時 |

### 3.3 砍／停用的 API

| 端點 | 處置 |
|------|------|
| `/api/clients/[id]/kyc` | 保留 endpoint，但 UI 不再呼叫（借址凍結） |
| `/api/clients/[id]/mail` | 同上 |
| `/api/seats/...` | 同上 |

---

## 四、儀表板三層 KPI 重設（最影響日常感受）

### 4.1 救火層（紅燈才看，平常不顯眼）

| KPI | 觸發紅燈條件 |
|-----|------------|
| 現金水位 | 低於 NT$73 萬警戒線 |
| 即將到期合約 | 30 天內到期且未續約 |
| 未到帳合約 | 簽約 14 天內未收到首付款 |
| 政府標案截止日 | 5 天內要交件但進度低於 80% |
| BPO 夥伴出勤異常 | 連續 3 天未打卡 |

**設計原則**：救火層平常**全綠**，只有真出事才會亮。**老闆打開儀表板第一眼看「平靜」就能安心**。

### 4.2 生存層（每天看的進度條）

| KPI | 顯示方式 |
|-----|---------|
| 本月實收 vs $182,520 損益平衡 | 進度條 + 百分比 |
| 五腳本月實收占比 | 堆疊柱狀圖（看誰扛起這個月） |
| 本月已簽合約金額 vs 上月 | 趨勢線 |
| 本月內訓場次（第五腳） | 累積數字 |
| 本月新增 leads（按五腳分） | 五個小圓圈 |

### 4.3 成長層（每月／每季看）

| KPI | 顯示方式 |
|-----|---------|
| 政府標案累積簽約數 | 大數字 + 走勢 |
| ESG 訓練包累積客戶數 | 大數字 + 走勢 |
| BPO 夥伴累積月費總額 | 大數字 + 走勢 |
| 學院產投補助送件進度 | 階段條（提案 / 審查 / 通過 / 開班） |
| 第五腳內訓場次累積（本年） | 大數字 |
| 個人 IP 內容產出數（IG / Podcast / SEO） | 三個堆疊柱狀 |

### 4.4 對應的 component 改造

| 動作 | 影響檔案數（估） |
|------|---------------|
| 重新設計 dashboard widget components | 8-12 個 .tsx |
| 新增 `/api/dashboard/*` 五個端點 | 5 個 route.ts |
| 重設 dashboard 主頁 layout | 1 個 page.tsx |

---

## 五、實作 roadmap（接續 PRD 階段二之後）

| 階段 | 對應這份藍圖的章節 | 預估時間 |
|------|----------------|---------|
| **階段二（下週）** | §4 儀表板三層 KPI + §3.1 5 個 aggregated endpoints | 2-3 天 |
| 階段三 | §1 UI 資訊架構重組（一級導航五腳化） | 2 天 |
| 階段四 | §2.3 leg_type 跨表加欄位（migration 023+024） + 既有 API 加 query param | 1-2 天 |
| 階段五 | §2.2 tenders 模組（業務進場後） | 2-3 天 |
| 階段六 | §2.2 BPO 模組（夥伴進場後） | 3-4 天 |
| 階段七 | §2.2 academy_subsidies（送件時） | 2 天 |

**整體預估**：階段二到階段四是核心改造，**約 5-7 天的有效工時**就能讓 CRM 從「v1 借址版」升級成「v2 五腳版」。階段五-七是業務驅動，等業務再做。

---

## 六、不做的事（明確排除）

| 不做的事 | 為什麼 |
|---------|--------|
| 不重寫現有 64 個 API | 加 query param 就夠 |
| 不刪任何 v1 的表 | 凍結就好、保留歷史資料 |
| 不為「還沒進場」的業務寫詳細模組 | tenders / bpo / academy 等業務真的進場再做 |
| 不換 Supabase 或 Vercel | 基礎建設運作良好 |
| 不重新設計 RLS policies | v1 已經做到位 |
| 不為了「比較專業」加多 RBAC | 3 人團隊不需要 |
| 不打掉電簽流程重做 | v1 的 015-019 已生產級 |

**這份『不做的事』比『要做的事』更重要** — 你會反覆受到誘惑要做這些，但記得：階段二到階段四先做完。

---

## 七、給未來自己的設計信念

| 信念 | 含義 |
|------|------|
| **業務領導架構，不是架構領導業務** | 一級導航長什麼樣，要看老闆每天怎麼想，不是工程師怎麼分模組 |
| **leg_type 一個欄位治天下** | 與其開五個模組各做一套，不如一個分類欄位串起既有資產 |
| **儀表板是業務的鏡子** | 鏡子裡看到什麼，老闆就會去做什麼。$182,520、$73 萬警戒線一定要在第一眼 |
| **凍結比刪除好** | 借址相關的表凍結就好，歷史資料是教學素材（見 `40 課程/01 素材庫/CRM 業務轉向重構素材.md`） |
| **PRD 是免費的，code 是貴的** | 這份藍圖寫完不代表要立刻全做，先用 PRD 圈地、業務進場再灌肉 |

---

## 八、跟教案的對應

這份藍圖本身就是教學素材：「**業務轉向時，CRM 怎麼從『按模組分』演化成『按業務腳分』**」是中小企業主聽完會眼睛發亮的主題。

請見 `40 課程/01 素材庫/CRM 業務轉向重構素材.md` 的延伸更新（下次寫教案時加進去）。

---

## 九、下一份文件預告（v0.3）

如果這份 v0.2 藍圖被你 review 通過、階段二-四真的跑完，下一份是 **`CRM-architecture-v0.3-five-leg.md`** — 那是「**現況版的五腳架構**」，不再是藍圖，是寫完後的事實記錄。**那一份檔案的存在本身就證明這次重構成功了**。
