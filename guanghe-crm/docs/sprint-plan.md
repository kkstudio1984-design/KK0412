# Sprint Plan - Phase 1 MVP

> 2026/04/14 ~ 2026/06/27（10 週）
> 目標：7/1 三院開業前完成所有 MVP 功能

## Sprint 1（4/14 ~ 4/25）基礎建設

- [ ] Supabase 專案建立 + schema 遷移
- [ ] 移除 Prisma，改用 Supabase Client
- [ ] DB schema 建立（共用資料層 + M1 所有表）
- [ ] Google OAuth 登入（Supabase Auth）
- [ ] 角色權限系統（admin / operator / viewer）
- [ ] RLS policy 設定
- [ ] 基礎 layout（sidebar + 角色判斷）

## Sprint 2（4/28 ~ 5/9）核心 CRM 增強

- [ ] CRM 看板增強（紅旗 badge、跟進倒數、流失自動判定）
- [ ] KYC 增強（override 機制 + 年度覆核提醒）
- [ ] 文件檢核（client_documents，依 service_type 自動產生清單）
- [ ] service_type 切換自動觸發 KYC
- [ ] 客戶詳情頁增強（新欄位：門禁卡、實質受益人等）

## Sprint 3（5/12 ~ 5/23）合約 + 收款

- [ ] 合約管理 CRUD（建立、押金、公證、到期提醒）
- [ ] 收款綁合約 + 帳單自動產生
- [ ] 四階段升級機制（提醒/催告/存證信函/退租啟動）
- [ ] 收款策略建議（自動建議年繳 + 兩個月押金）

## Sprint 4（5/26 ~ 6/5）信件 + 退場 + 軌跡

- [ ] 信件代收管理（法院文書置頂、領取追蹤、自動退回）
- [ ] 退場流程（遷出追蹤、押金扣抵邏輯、退場完成條件）
- [ ] audit_logs（DB trigger 自動記錄關鍵欄位變更）

## Sprint 5（6/8 ~ 6/20）儀表板 + 總覽

- [ ] 三層式儀表板（救火/生存/成長）
- [ ] 地址風險總覽頁面（統編/負責人搜尋）
- [ ] 營收目標線（紅線 15 萬 / 目標線 37.5 萬）
- [ ] 未來 90 天現金流預測
- [ ] 座位超賣率

## Sprint 6（6/23 ~ 6/27）收尾

- [ ] 12 項驗收標準逐一確認（AC-1 ~ AC-12）
- [ ] Bug 修復 + 效能調整
- [ ] Vercel 正式部署 + 環境變數更新
- [ ] 使用者帳號建立（6 人 Google OAuth）
