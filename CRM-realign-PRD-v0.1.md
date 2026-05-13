# PRD｜光合創學 CRM 對齊五腳營運模型（CRM Realign v0.1）

> 版本：v0.1（草稿）
> 建立日期：2026-05-13
> 上游文件：光合創學三院籌備期營運規劃 PRD 2.0（Notion page_id `30a5ec73-4586-45ae-950c-b316ed99f966`）
> 下游文件：本檔的執行版會拆成多個 git commit 到 `feature/crm-realign-v3-week1` 分支
> 設計者：光光 × Claude

---

## 0. 為什麼要做這份 PRD

2026-05-07 業務 PRD 2.0 釋出，光合創學的商業模式從「共享辦公空間（含借址登記為主業務）」全面重寫成「**五腳並行的韌性籌備邏輯**」：

| 腳 | 業務 | 客單／收費 |
|---|------|----------|
| 第一腳 | ESG/DEI 體驗訓練包 | NT$5–20 萬／案（金管會 2027 永續報告書 DEI 必填） |
| 第二腳 | 政府身障就業標案 | 第一年 NT$50–150 萬／案 |
| 第三腳 | Inclusion BPO 數位後勤 | 每位夥伴 NT$2.5–4 萬／月（身權法第 38 條） |
| 第四腳 | AI × 共融職能轉換學院 | 勞動部產投補助 80%（審查 6 個月以上） |
| 第五腳 | 光光個人 IP × 付費社群 × 企業內訓 | NT$3–8 萬／場 |

**月損益平衡點 NT$182,520、月固定成本 NT$15–20 萬、現金警戒線 NT$73 萬（4 個月固定成本）**。

guanghe-crm 是 4 月做的 v1，當時主軸是「3-5 小時極簡借址登記管理」。**借址被擋之後，現有 6 大模組約 30% 的功能變成佔位、20% 的客戶模型對不上新業務、50% 的合約與活動相關功能仍然有用**。

這份 PRD 的目標是**讓 CRM 重新對齊到五腳營運模型**，並把改動以最低風險、最小爆炸半徑的方式分階段執行。

---

## 1. 設計原則（這次重構的鐵律）

| 原則 | 含義 |
|------|------|
| **不刪 code，只改 navigation** | 第一階段所有改動都是「從 UI 拿掉」，不刪檔案。保留 git 歷史，未來業務若回來可隨時開啟 |
| **新業務出現再做新模組** | 不預先寫第三腳 BPO、第四腳學院的完整模組（等真的有夥伴／學員進來再做） |
| **儀表板 KPI 優先重設** | KPI 是老闆每天看的，重設 KPI 比改任何模組更影響日常感受 |
| **migrations 加而不改** | DB schema 用新欄位、新表，不改既有欄位（避免歷史資料毀損） |
| **每個 commit 都能獨立 rollback** | 每個改動小到 5 分鐘內可以 revert |

---

## 2. 範圍切片（第 1-10 週分階段）

### 階段一（第 1 週）：UI 清理 + 客戶模型擴張

**目的**：把 UI 上「明顯不再使用」的入口拿掉，並為新業務埋下客戶分類的種子。

| 編號 | 動作 | 影響範圍 | 風險 | rollback 方式 |
|------|------|---------|------|------------|
| 1.1 | 從主 navigation 拿掉 `/address-risk` 連結 | sidebar / nav config 1-2 個檔案 | 🟢 極低 | revert commit |
| 1.2 | 把 `/seats` 從主導航移到 admin 子選單 | 同上 | 🟢 極低 | revert commit |
| 1.3 | 新增 migration 022_client_type.sql：在 `space_clients` 或 `organizations` 加 `client_type` 欄位，類型枚舉：`borrow_address` / `coworking` / `esg_dei` / `gov_tender` / `inclusion_bpo` / `academy` / `personal_ip` / `other`，預設 `other` | DB schema | 🟡 中（schema 改動但只加欄位） | 新 migration 023 drop column |
| 1.4 | clients UI 加上「客戶類型」下拉選單 | clients 模組 3-5 個檔案 | 🟢 低 | revert commit |

**完成標準**：本機 npm run dev 跑起來、新欄位可填、舊資料不受影響、Playwright 主要 e2e 不掛。

### 階段二（第 1-2 週）：儀表板三層 KPI 重設

**目的**：老闆每天看的儀表板，最先換掉。

| 編號 | 動作 | 影響範圍 | 風險 |
|------|------|---------|------|
| 2.1 | 重新設計「救火層」KPI | dashboard 5-10 個 widget | 🟡 中 |
| 2.2 | 重新設計「生存層」KPI（含月損益平衡點 $182,520 警戒線） | 同上 | 🟡 中 |
| 2.3 | 重新設計「成長層」KPI（五腳各自簽約／案件數） | 同上 | 🟡 中 |

| 層 | 新 KPI 設計 |
|----|----------|
| 救火 | 現金水位 vs $73 萬警戒線（紅黃綠燈）／未到帳合約金額／30 天內到期合約 |
| 生存 | 本月實收 vs $182,520（百分比進度條）／五腳本月實收占比堆疊圖 |
| 成長 | 政府標案累積案數／ESG 訓練包簽約累積／BPO 夥伴月費總額／學院產投送件進度／光光內訓場次累積 |

### 階段三（第 2-3 週）：sales pipeline 重新對應五腳

**目的**：銷售管線從「借址 Kanban 7 stages」改成五腳並行漏斗。

| 編號 | 動作 |
|------|------|
| 3.1 | 在 sales 模組加上「業務線」篩選器（五腳） |
| 3.2 | 每腳設定獨立的 stage 流程（ESG 訓練包跟政府標案的階段截然不同） |
| 3.3 | dashboard 顯示五腳各自的轉換率 |

**注意**：政府標案因為流程特殊（投標 → 等決標 → 履約 → 核銷），建議**獨立一個 `/tenders` 模組**而不是塞進 sales。階段三只先做 ESG 訓練包、Inclusion BPO、學院招生、個人 IP 內訓四條漏斗。

### 階段四（第 3-4 週）：合約範本五腳化

**目的**：contracts 模組目前的合約範本是借址版本，要補五腳版。

| 編號 | 動作 |
|------|------|
| 4.1 | 在 contracts 範本表加上「業務類型」分類 |
| 4.2 | 撰寫五腳各自的合約範本 v0.1（這格 70% 是內容工作、30% 是 code 工作） |

### 階段五（第 4-6 週）：新增 `/tenders` 政府標案管理模組

**目的**：政府標案是第二腳，流程獨特，需要獨立模組。

| 編號 | 動作 |
|------|------|
| 5.1 | 新增 migration 023_tenders.sql：建立 `tenders` 表、`tender_documents` 表、`tender_milestones` 表 |
| 5.2 | 建立 `/tenders` 頁面：投標清單、進行中標案、已結案標案 |
| 5.3 | 建立 `/tenders/[id]` 詳情頁：含投標公告連結、投標準備文件、決標狀態、履約進度、核銷狀態 |

**最小可行版（v0.1）**：只做投標公告登錄 + 狀態切換（投標中／已決標／履約中／已核銷）。其他自動化等真的接到第一個案子再做。

### 階段六（第 6-8 週）：partners 擴張成身障夥伴 BPO 管理

**等真的接到第一位 BPO 夥伴再做**。預先寫好 spec 但不開發。

### 階段七（第 8-10 週）：training 接勞動部產投補助

**等學院送件通過再做**。產投補助流程要 6 個月以上，這格不急。

---

## 3. 改動清單（第 1 週可立即執行的部分）

| 檔案 / 路徑 | 動作 | 描述 |
|-----|------|------|
| `app/(dashboard)/layout.tsx` 或 `components/sidebar.tsx` | 修改 | 從 navigation 移除 address-risk、把 seats 移到 admin 子選單 |
| `supabase/migrations/022_client_type.sql` | 新增 | 加 `client_type` 欄位到 organizations |
| `app/(dashboard)/clients/[id]/page.tsx` | 修改 | 加客戶類型下拉 |
| `app/(dashboard)/clients/new/page.tsx` | 修改 | 同上 |
| `app/api/clients/route.ts` | 修改 | 接收新欄位 |
| `lib/types.ts` 或對應的 types 檔 | 修改 | 加 ClientType 型別 |

---

## 4. 風險清單與 mitigation

| 風險 | 機率 | 影響 | mitigation |
|------|-----|------|---------|
| migration 022 跑到 Supabase Cloud 失敗 | 低 | 中 | 先本機跑、確認後再 push；migration 內含 `IF NOT EXISTS` |
| 拿掉 address-risk 後，仍有別處引用造成 build 失敗 | 中 | 中 | 用 grep 找所有 references，全部 stub 或 conditional 處理 |
| 客戶類型分類設錯，未來改類型枚舉很麻煩 | 低 | 高 | 用 enum + string fallback、不寫死 |
| 改 dashboard KPI 影響 demo 環境 | 低 | 中 | 全部改動在 feature branch，不 push 到 main |

---

## 5. 完成 v0.1 後的下一步

| 編號 | 動作 |
|------|------|
| 5.1 | feature branch 跑起來、本機驗證 |
| 5.2 | 截 5 張對比圖（before/after）放進素材庫 |
| 5.3 | 把這次重構過程寫成「CRM 隨業務轉向而重構」教學素材 |
| 5.4 | 你（光光）review、合併到 main、推進 vercel production |

---

## 6. 對應的教學素材轉化

這次重構過程**本身就是中小企業主最想看的教案**：「我做了系統，業務轉向時系統怎麼跟著轉？」

請見 `40 課程/01 素材庫/CRM 業務轉向重構素材.md`。
