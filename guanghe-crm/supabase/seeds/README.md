# Supabase Seeds

這個資料夾收的是「**非正式 migration 但常用的 SQL 範例**」 —
- 不是 schema 變更（那放 `migrations/`）
- 不是測試資料（那不該進 production DB）
- 是「**第一次入庫時的最小起點資料**」

## 使用方式

1. 在 Supabase Studio → SQL Editor
2. 複製對應的 `.sql` 內容貼進去
3. **執行前先檢查欄位值是否符合你的真實狀況**（特別是個資）
4. 跑一次

## 現有 seeds

| 檔案 | 用途 | 何時跑 |
|------|------|------|
| `example_student_a.sql` | 學員 A 入庫範例 | migration 023 跑完之後 |
