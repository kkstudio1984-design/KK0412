export const PRESENTATION_HTML_2026Q2 = String.raw`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>光合創學 · 2026 Q2 股東會議簡報（討論版）</title>
<style>
  :root {
    --gold: #d97706;
    --gold-light: #f59e0b;
    --ink: #1c1917;
    --soft: #57534e;
    --muted: #78716c;
    --line: #e7e5e4;
    --bg: #f5f5f4;
    --card: #ffffff;
    --warn-bg: #fef3c7;
    --warn-fg: #92400e;
    --ok-bg: #f0fdf4;
    --ok-fg: #15803d;
    --bad-bg: #fef2f2;
    --bad-fg: #b91c1c;
    --think-bg: #faf5ff;
    --think-fg: #6b21a8;
    --think-border: #e9d5ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif;
    color: var(--ink);
    line-height: 1.75;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 880px; margin: 0 auto; padding: 40px 24px 80px; }
  section.slide {
    background: var(--card);
    border-radius: 20px;
    padding: 56px 48px;
    margin-bottom: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    page-break-after: always;
  }
  section.slide:last-child { page-break-after: auto; }
  .brand {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 12px;
  }
  .brand-mark {
    width: 48px; height: 48px; border-radius: 12px;
    background: linear-gradient(135deg, var(--gold-light), var(--gold));
    display: flex; align-items: center; justify-content: center;
    color: #0a0a0a; font-weight: 800; font-size: 22px;
  }
  .brand-name { font-size: 13px; color: var(--muted); margin: 0; }
  .brand-sub { font-size: 14px; font-weight: 600; margin: 0; }
  h1.cover-title {
    font-size: 40px; line-height: 1.3; margin: 32px 0 12px;
    letter-spacing: -0.5px;
  }
  .cover-meta { color: var(--muted); font-size: 14px; margin: 0; }
  h2.section-title {
    font-size: 28px; margin: 0 0 8px; letter-spacing: -0.3px;
  }
  .section-sub {
    color: var(--muted); font-size: 14px; margin: 0 0 32px;
    border-bottom: 1px solid var(--line); padding-bottom: 16px;
  }
  h3 {
    font-size: 17px; margin: 28px 0 10px;
    color: var(--ink); font-weight: 600;
  }
  h4 {
    font-size: 14px; margin: 16px 0 6px;
    color: var(--soft); font-weight: 600;
  }
  p { margin: 0 0 14px; color: var(--ink); }
  .lead { font-size: 16px; color: var(--soft); }
  .kpis {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 14px; margin: 20px 0 24px;
  }
  .kpi {
    background: #fafaf9; border: 1px solid var(--line);
    border-radius: 14px; padding: 18px;
  }
  .kpi-label { font-size: 12px; color: var(--muted); margin: 0 0 6px; }
  .kpi-val {
    font-size: 24px; font-weight: 700; color: var(--ink); margin: 0;
    letter-spacing: -0.3px;
  }
  .kpi-val.green { color: var(--ok-fg); }
  .kpi-val.red { color: var(--bad-fg); }
  .kpi-note { font-size: 11px; color: var(--muted); margin: 6px 0 0; font-style: italic; }
  .pill {
    display: inline-block; padding: 4px 10px; border-radius: 6px;
    font-size: 12px; font-weight: 600;
  }
  .pill.warn { background: var(--warn-bg); color: var(--warn-fg); }
  .pill.ok { background: var(--ok-bg); color: var(--ok-fg); }
  .pill.bad { background: var(--bad-bg); color: var(--bad-fg); }
  .pill.think { background: var(--think-bg); color: var(--think-fg); }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 14px; }
  td, th { padding: 12px 0; border-bottom: 1px solid var(--line); text-align: left; }
  th { color: var(--muted); font-weight: 600; font-size: 12px; }
  td:last-child, th:last-child { text-align: right; }
  ul.clean { list-style: none; padding: 0; margin: 12px 0; }
  ul.clean li {
    padding: 12px 0; border-bottom: 1px solid var(--line);
    display: grid; grid-template-columns: 90px 1fr; gap: 16px;
    align-items: start;
  }
  ul.clean li:last-child { border-bottom: 0; }
  ul.clean .when { color: var(--muted); font-size: 13px; }
  .quote {
    border-left: 3px solid var(--gold);
    padding: 6px 0 6px 16px; margin: 16px 0;
    color: var(--soft); font-style: italic;
  }
  .ask {
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 12px; padding: 18px; margin: 16px 0;
  }
  .ask h4 { margin: 0 0 8px; color: var(--warn-fg); font-size: 14px; }
  .think {
    background: var(--think-bg);
    border: 1px solid var(--think-border);
    border-radius: 12px; padding: 16px 18px; margin: 14px 0;
  }
  .think h4 { margin: 0 0 6px; color: var(--think-fg); font-size: 13px; }
  .think p { margin: 0 0 6px; color: var(--ink); font-size: 14px; }
  .think p:last-child { margin: 0; }
  .fork {
    background: #fafaf9; border: 1px solid var(--line);
    border-radius: 12px; padding: 18px; margin: 14px 0;
  }
  .fork h4 { margin: 0 0 10px; color: var(--ink); font-size: 15px; }
  .fork-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .fork-option {
    background: #fff; border: 1px solid var(--line);
    border-radius: 10px; padding: 14px;
  }
  .fork-option strong { display: block; margin-bottom: 6px; color: var(--ink); }
  .fork-option p { font-size: 13px; color: var(--soft); margin: 0; line-height: 1.7; }
  .fork-q {
    background: #fffbeb; border-top: 1px dashed #fde68a;
    margin-top: 12px; padding-top: 10px;
    color: var(--warn-fg); font-size: 13px; font-weight: 500;
  }
  .scenarios {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin: 16px 0;
  }
  .scenario {
    border-radius: 12px; padding: 16px;
  }
  .scenario.optimistic { background: var(--ok-bg); border: 1px solid #bbf7d0; }
  .scenario.base { background: #fafaf9; border: 1px solid var(--line); }
  .scenario.pessimistic { background: var(--bad-bg); border: 1px solid #fecaca; }
  .scenario h4 { margin: 0 0 8px; font-size: 13px; }
  .scenario.optimistic h4 { color: var(--ok-fg); }
  .scenario.pessimistic h4 { color: var(--bad-fg); }
  .scenario p { font-size: 13px; line-height: 1.6; margin: 0; }
  .toolbar {
    margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
    font-size: 13px; color: var(--muted); flex-wrap: wrap;
  }
  .heart {
    background: linear-gradient(135deg, #fff7ed, #fef3c7);
    border: 1px solid #fde68a; border-radius: 14px;
    padding: 22px; margin: 16px 0;
  }
  .heart p { color: var(--ink); font-size: 15px; line-height: 1.85; margin: 0 0 10px; }
  .heart p:last-child { margin: 0; }
  @media print {
    body { background: #fff; }
    .wrap { padding: 0; max-width: none; }
    section.slide {
      box-shadow: none; border: 1px solid var(--line);
      margin: 0 0 12px; border-radius: 0;
      padding: 40px;
    }
    .toolbar, .no-print { display: none !important; }
  }
  @page { size: A4; margin: 14mm; }
</style>
</head>
<body>
<div class="wrap">

<div class="toolbar no-print">
  <span class="pill warn">討論版</span>
  <span class="pill think">紫框 = 我自己還想不清的事</span>
  <span class="pill warn">黃框 = 想請股東幫忙</span>
  <span>⌘P 列印或匯出 PDF</span>
</div>

<!-- ──────── 1. 封面 ──────── -->
<section class="slide">
  <div class="brand">
    <div class="brand-mark">光</div>
    <div>
      <p class="brand-name">光合創學股份有限公司 · Guanghe</p>
      <p class="brand-sub">社會企業 · 創立於 2023</p>
    </div>
  </div>
  <h1 class="cover-title">2026 Q2<br>股東會議簡報</h1>
  <p class="cover-meta">這不是一份報告，是一份請股東一起討論的工作文件</p>
  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line);">
    <p class="cover-meta">主講｜光光（林政緯）· Miu</p>
    <p class="cover-meta">日期｜2026 年 5 月 7 日</p>
    <p class="cover-meta" style="margin-top:24px;">這份簡報刻意把「我自己還沒想清楚的事」也放上來，希望今天股東能用各位的經驗幫我看見盲點。</p>
  </div>
</section>

<!-- ──────── 2. 我們是誰 ──────── -->
<section class="slide">
  <h2 class="section-title">我們是誰</h2>
  <p class="section-sub">用一頁說清楚光合創學在做的三件事</p>

  <p class="lead">光合創學是一家走在「空間 × 教育 × AI」三角形交集的社會企業。我們不是純粹的共享空間業者、也不是單純的課程公司，而是把這三件事整合成一個「**讓創業者用更少的營運成本、更輕的合規負擔、更聰明的工具，把生意跑起來**」的支援系統。</p>

  <h3>一、三院空間（空間端）</h3>
  <p>提供台北中山區的辦公空間月租、借址登記與 KYC 合規服務。客戶從一人接案者、剛起跑的新創、到有合規需求的中小企業都有。</p>

  <h3>二、光合學院（教育端）</h3>
  <p>NLP 溝通、生成式 AI 應用、Vibe Coding 等課程設計與培訓。光光本人是 AI 應用講師、NLP 高級執行師，教學品牌已累積一批回流學員。</p>

  <h3>三、AI 轉型顧問（系統端）</h3>
  <p>結合 BNI 行業別 AI 顧問身份，幫助中小企業導入 ChatGPT、Claude、NotebookLM、Notion AI 等工具，把 AI 從「玩具」轉成「員工」。</p>

  <div class="quote">
    我們在做的事，是讓「想創業但被合規、行政、學習成本擋住」的人，可以更輕鬆地跨進門。
  </div>

  <div class="think">
    <h4>我自己還在想的事</h4>
    <p>三條業務線**到底是相輔相成、還是把光光的時間切碎了**？理想上空間客戶會變課程學員、課程學員會變 AI 顧問客戶，但目前轉化率沒有量化。今天希望股東一起想：要繼續三條並行、還是聚焦其中一條？</p>
  </div>
</section>

<!-- ──────── 3. 上一階段績效 ──────── -->
<section class="slide">
  <h2 class="section-title">上一階段績效（2026 Q1）</h2>
  <p class="section-sub">數字以系統估算為主，請股東協助校正</p>

  <p class="lead">**坦白說**：今天會議前 guanghe-crm 的月報自動化還在最後上線階段，所以下面的 Q1 數字是用系統現有資料能撈到的部分 + 我自己估算填補。如果跟會計實際帳對不起來，請股東現場糾正。</p>

  <h3>財務概況（估算）</h3>
  <div class="kpis">
    <div class="kpi">
      <p class="kpi-label">Q1 應收</p>
      <p class="kpi-val">NT$ ___,___</p>
      <p class="kpi-note">可從 CRM 月報撈，今天會議前補</p>
    </div>
    <div class="kpi">
      <p class="kpi-label">Q1 實收</p>
      <p class="kpi-val green">NT$ ___,___</p>
      <p class="kpi-note">收款率目標 ≥ 90%</p>
    </div>
    <div class="kpi">
      <p class="kpi-label">較 2025 Q4 成長</p>
      <p class="kpi-val">±___%</p>
      <p class="kpi-note">需要會計提供 Q4 比對基期</p>
    </div>
    <div class="kpi">
      <p class="kpi-label">毛利率（估）</p>
      <p class="kpi-val">___%</p>
      <p class="kpi-note">空間／課程／顧問三線毛利結構不同</p>
    </div>
  </div>

  <h3>客戶動態（CRM 系統可撈）</h3>
  <table>
    <tr><th>項目</th><th>數量 / 區間</th></tr>
    <tr><td>新增客戶</td><td>___ 家</td></tr>
    <tr><td>退場 / 結案</td><td>___ 家</td></tr>
    <tr><td>KYC 查核通過</td><td>___ 項</td></tr>
    <tr><td>合約到期續約率</td><td>___%</td></tr>
    <tr><td>合約被拒簽（新指標）</td><td>___ 份（系統 5 月才開始累積）</td></tr>
  </table>

  <div class="think">
    <h4>數據盲點</h4>
    <p>目前沒有的：**客戶 LTV、CAC、單一客戶平均月費、課程毛利、顧問案件平均報價**。這些是判斷商業模式好壞的關鍵指標，但 CRM 還沒長出對應的查詢。是否要把「補齊財務面 KPI」列為 Q2 系統優先順序？</p>
  </div>
</section>

<!-- ──────── 4. 系統建設進度 ──────── -->
<section class="slide">
  <h2 class="section-title">系統建設進度</h2>
  <p class="section-sub">本季技術投入：把人工流程一條條變成自動化</p>

  <p class="lead">過去這個季度我們把「**讓光光不需要 24 小時盯系統**」當成主要工程目標。今天股東看到的成果是：合約自動寄、催繳自動寄、月報自動寄、客戶拒簽我立刻收到通知。</p>

  <h3>2026 Q1–5 月已完成</h3>
  <ul class="clean">
    <li><span class="when">2026-04</span><div><strong>合約電子簽署</strong><br>客戶手機點連結即可簽，含手寫簽名、IP 紀錄、簽名圖留存。簽完自動寄合約副本給客戶（含手寫簽名圖）。</div></li>
    <li><span class="when">2026-05</span><div><strong>拒絕原因系統</strong><br>客戶拒簽時可填原因，後台累積成業務情報，未來用來優化銷售話術與合約條款。</div></li>
    <li><span class="when">2026-05</span><div><strong>內部即時通知</strong><br>客戶拒簽當下，光光的信箱即時收到通知，不會丟單還不知道。</div></li>
    <li><span class="when">2026-05</span><div><strong>每日營運摘要</strong><br>系統每天 9 點自動掃合約到期、付款逾期、KYC 卡關，產出摘要寄給內部。</div></li>
    <li><span class="when">2026-05</span><div><strong>股東月報自動化（基礎建設）</strong><br>每月 1 號自動寄當月營運數據給所有 viewer。**但今天還在最後三件事的設定階段：Supabase schema、Vercel 環境變數、Resend domain 驗證。**</div></li>
  </ul>

  <h3>還沒收尾的部分（誠實揭露）</h3>
  <div class="ask">
    <h4>三件事尚未完成</h4>
    <p>1. Supabase Cloud 還要跑兩個 migration（5 分鐘）<br>2. Vercel 環境變數要設五個（10 分鐘）<br>3. Resend domain 驗證（要登入 Resend 後台、加 DNS 紀錄，可能需要等 24 小時）</p>
    <p style="margin-top:8px;font-size:13px;color:var(--muted);">這三件事光光今天會後就會處理，預計這週完成。月報下個月 1 號（2026-06-01）會第一次自動寄出。</p>
  </div>

  <h3>技術投入的「複利」效應</h3>
  <p>每一條自動化都是一次性投資、永久回報。這些自動化讓光光的時間能花在更高價值的事情：拓展業務、設計新課程、寫 Podcast、做 AI 顧問。</p>
</section>

<!-- ──────── 5. 三條業務線進展 ──────── -->
<section class="slide">
  <h2 class="section-title">三條業務線：現況與不確定</h2>
  <p class="section-sub">每條線的本季亮點 + 我自己還沒想清楚的問題</p>

  <h3>① 三院空間（借址登記 + 共享辦公）</h3>
  <p>本季空間端的主要工作放在**自動化客戶觸達**（合約簽署、KYC 提醒、續約通知），而不是拓客。因為光光判斷：先把現有客戶服務好、續約率拉高，比一直找新客 CP 值更高。</p>
  <div class="think">
    <h4>不確定 1：滿租率天花板</h4>
    <p>三院空間目前的滿租率是 ___%（會議當天確認）。要繼續維持當前坪數、還是擴增？擴增的話進貨第二空間的時點怎麼判斷？</p>
  </div>
  <div class="think">
    <h4>不確定 2：借址客戶的法律邊際</h4>
    <p>借址登記近年法規與國稅局態度越來越嚴。我們的 KYC 流程足夠嗎？萬一有客戶出事我們的責任邊界？這需要法律顧問定期檢視 — 但目前沒有定期顧問。</p>
  </div>

  <h3>② 光合學院（NLP / AI / Vibe Coding 課程）</h3>
  <p>本季新開「Vibe Coding 入門」班，回流學員比率高。但企業內訓的拓展還沒系統化。</p>
  <div class="think">
    <h4>不確定 3：課程定價結構</h4>
    <p>目前是按「單堂課 / 整套課程」收費，但企業內訓常常會被砍價。要不要建立「個人 vs 企業」雙軌定價，還是維持單一價格保品牌一致性？</p>
  </div>
  <div class="think">
    <h4>不確定 4：學員回流的真實原因</h4>
    <p>回流率高是好事，但**到底是「光光的個人魅力」還是「課程內容本身」**？如果是前者，這條線就難複製、難擴張。</p>
  </div>

  <h3>③ AI 轉型顧問（BNI + 課程衍生）</h3>
  <p>顧問案件主要來源是 BNI 引薦 + 課程學員轉化。報價結構還在試（按小時 vs 按案件 vs 月費）。</p>
  <div class="think">
    <h4>不確定 5：BNI 來源的脆弱性</h4>
    <p>如果 BNI 那條線斷了（換 chapter、引薦人變動、AI 顧問行業別已被搶走），顧問業績會立刻掉一大半。怎麼把「人脈」變成「系統」推薦？</p>
  </div>
  <div class="think">
    <h4>不確定 6：顧問交付產出怎麼標準化</h4>
    <p>目前每個案件都從零客製，光光自己跳進去做。**沒有可複製的方法論 = 這條線永遠做不大**。要不要寫一份「光合 AI 顧問交付手冊」？</p>
  </div>
</section>

<!-- ──────── 6. Q2 計畫（討論版）──────── -->
<section class="slide">
  <h2 class="section-title">2026 Q2 計畫（討論版）</h2>
  <p class="section-sub">這是我目前的優先順序排序，請股東 challenge 是否合理</p>

  <p class="lead">這一季我自己想做的主軸是「**把已建立的系統開始產出可量化的業務價值**」。系統建好不是終點，看到客戶因為這些自動化而留得更久、付款更準時、續約率更高，才是。</p>

  <h3>業務面（按我目前優先順序）</h3>
  <ul class="clean">
    <li><span class="when">5 月</span><div>把月報 cron 上線完成 → 每月 1 號股東收到自動信</div></li>
    <li><span class="when">5 月底</span><div>第一次「拒絕原因復盤」：把累積到的拒簽資料整理出共通模式，回頭優化銷售話術</div></li>
    <li><span class="when">6 月</span><div>三院空間滿租率衝刺：拉到 ___%（具體數字今天討論決定）</div></li>
    <li><span class="when">6 月</span><div>建立「AI 顧問交付方法論」初版：把光光腦袋裡的東西寫成 SOP</div></li>
    <li><span class="when">7 月</span><div>啟動企業內訓拓展：列出 ___ 家潛在客戶名單</div></li>
  </ul>

  <h3>內容面（持續累積品牌）</h3>
  <ul class="clean">
    <li><span class="when">每週</span><div>IG 兩篇貼文 + Facebook 一篇真實內心話</div></li>
    <li><span class="when">每月</span><div>《夢裡什麼都有》Podcast 至少 N 集（深度人生訪談非成功學）</div></li>
    <li><span class="when">本季</span><div>B2B SEO 長文 N 篇，主題待定（這次討論看股東有什麼建議）</div></li>
  </ul>

  <h3>系統面</h3>
  <ul class="clean">
    <li><span class="when">5 月</span><div>月報 cron 上線 + Resend domain 驗證</div></li>
    <li><span class="when">6 月</span><div>補齊財務面 KPI（LTV、CAC、毛利結構查詢）</div></li>
    <li><span class="when">7 月</span><div>第二輪優化：續約 workflow、催繳自動升級、客戶健康度評分</div></li>
  </ul>

  <div class="think">
    <h4>請股東幫我看：這個排序合理嗎？</h4>
    <p>我目前把「**內部系統收尾 + 自我復盤**」排在「**外部拓客**」前面。這是因為我相信現有客戶服務好、續約率高，比一直找新客更穩。但如果股東認為現金流壓力大、應該先衝業績，請現場告訴我。</p>
  </div>
</section>

<!-- ──────── 7. 策略岔路 ──────── -->
<section class="slide">
  <h2 class="section-title">需要本次會議拍板的策略岔路</h2>
  <p class="section-sub">這幾個 A/B 選擇我自己也不確定，希望今天定下來</p>

  <div class="fork">
    <h4>岔路 1：第二空間 vs 深耕第一空間</h4>
    <div class="fork-options">
      <div class="fork-option">
        <strong>A. 開第二空間</strong>
        <p>趁三院空間滿租率衝高時擴增坪數，搶下一波借址登記需求。但要承擔租金、裝修、新地點客流不確定。</p>
      </div>
      <div class="fork-option">
        <strong>B. 深耕第一空間</strong>
        <p>把現有空間的服務、設備、品牌做到最好，以「精品共享空間」定位往上走，單客單價拉高。</p>
      </div>
    </div>
    <p class="fork-q">今天希望聽股東怎麼看：股東有沒有觀察到外部空間市場的訊號？</p>
  </div>

  <div class="fork">
    <h4>岔路 2：擴編全職 vs 維持一人光光 + 兼職協作</h4>
    <div class="fork-options">
      <div class="fork-option">
        <strong>A. 招一名全職營運</strong>
        <p>把光光從日常行政中解放出來，全力做高價值的課程設計、顧問與品牌。但月薪固定支出 + 訓練成本 + 文化磨合期。</p>
      </div>
      <div class="fork-option">
        <strong>B. 繼續用兼職 / 外包協作</strong>
        <p>萬叔、海龜、斑鳩、Miu 各自分工。靈活、低固定成本，但每一塊都不深、光光容易被切碎。</p>
      </div>
    </div>
    <p class="fork-q">關鍵問題：公司現金流是否能撐起一個全職人員 6–12 個月的緩衝？</p>
  </div>

  <div class="fork">
    <h4>岔路 3：課程定價（個人 vs 企業雙軌？）</h4>
    <div class="fork-options">
      <div class="fork-option">
        <strong>A. 雙軌定價</strong>
        <p>個人單價降低、擴大學員池；企業內訓單價拉高、走專業形象。</p>
      </div>
      <div class="fork-option">
        <strong>B. 單一定價</strong>
        <p>維持目前的單一價格、保持品牌一致性。簡單好溝通，但企業客容易砍價。</p>
      </div>
    </div>
    <p class="fork-q">想聽股東各自從 BNI / 商會的觀察來幫我判斷。</p>
  </div>

  <div class="fork">
    <h4>岔路 4：加密貨幣套利策略 vs 公司業務</h4>
    <div class="fork-options">
      <div class="fork-option">
        <strong>A. 把它變成「個人興趣」</strong>
        <p>跟公司業務切開，光光自己玩、不影響公司資源分配。</p>
      </div>
      <div class="fork-option">
        <strong>B. 整合進「AI × 量化」課程線</strong>
        <p>把學習過程包裝成課程或顧問內容（例：「AI 量化套利新手班」），延伸光合的教育產品線。</p>
      </div>
    </div>
    <p class="fork-q">這條我自己傾向 A（不分散公司焦點），但想聽股東有沒有不同看法。</p>
  </div>
</section>

<!-- ──────── 8. 風險與請求 ──────── -->
<section class="slide">
  <h2 class="section-title">風險、挑戰與請求</h2>
  <p class="section-sub">具體寫出來，請股東評估與協助</p>

  <h3>目前看見的三個主要風險</h3>
  <div class="ask">
    <h4>風險 1：BNI 引薦來源依賴</h4>
    <p>顧問案件 ___% 來自 BNI 單一管道。如果該 chapter 的 AI 行業別被取代或人脈圈變動，顧問收入會立刻受衝擊。</p>
  </div>
  <div class="ask">
    <h4>風險 2：法規環境（借址登記）</h4>
    <p>2025–2026 年國稅局與經濟部對「商業用地址登記」的查核越來越嚴。我們需要法律顧問定期審視 SOP，但目前沒有固定法律支援。</p>
  </div>
  <div class="ask">
    <h4>風險 3：人力斷層（光光單點故障）</h4>
    <p>所有業務線目前都需要光光本人介入決策。如果光光生病或休假超過兩週，公司運作會卡住。這是擴編討論的核心。</p>
  </div>

  <h3>對股東的具體請求</h3>
  <div class="ask">
    <h4>引薦類</h4>
    <p>1. 中小企業 AI 轉型顧問案件（你身邊有沒有正在「想導入 AI 但不知從哪開始」的老闆？）<br>2. 課程合作機會：商會、產業公會、社團法人的內訓邀約<br>3. 媒體曝光：Podcast 來賓互推、商業雜誌專訪</p>
  </div>
  <div class="ask">
    <h4>資源類</h4>
    <p>1. 法律顧問人選推薦（特別是公司法、商業登記領域）<br>2. 會計師事務所推薦（目前帳務外包，是否要升級到月度回顧）<br>3. 全職營運人選推薦（如果策略岔路 2 選 A）</p>
  </div>
  <div class="ask">
    <h4>決策類</h4>
    <p>今天會議希望拍板的事：<br>① 第二空間 vs 深耕第一空間<br>② 擴編全職 vs 維持兼職協作<br>③ 課程定價結構<br>④ 加密貨幣策略邊界<br>⑤ 年度行銷預算（IG 投放 / Podcast 製作 / SEO 寫作外包）</p>
  </div>
</section>

<!-- ──────── 9. 12 個月情境模擬 ──────── -->
<section class="slide">
  <h2 class="section-title">12 個月後的三種光合創學</h2>
  <p class="section-sub">給股東看「樂觀／中庸／悲觀」三個情境，讓決策有對照</p>

  <p class="lead">**為什麼做這個情境模擬：**避免大家用「平均期望值」估算未來，因為平均值常常掩蓋真實的好與壞。把三種未來攤開，反而看得清楚現在每個決策的影響。</p>

  <div class="scenarios">
    <div class="scenario optimistic">
      <h4>🌞 樂觀 / 順風</h4>
      <p>滿租率到頂、第二空間開設、企業內訓打開、AI 顧問月費客戶 ≥ 3 家。光光從日常行政抽離，全力做高價值。年營收 +___%。</p>
    </div>
    <div class="scenario base">
      <h4>🌤 中庸 / 持平</h4>
      <p>三院空間維持滿租、課程穩定、顧問靠 BNI 持續來源。光光仍是單點瓶頸，但系統把瓶頸減輕。年營收 +___%。</p>
    </div>
    <div class="scenario pessimistic">
      <h4>⛈ 悲觀 / 逆風</h4>
      <p>借址登記法規收緊客戶大量退場、課程市場被免費 AI 內容取代、BNI 引薦中斷顧問案件減半。需要動用儲備或股東增資。</p>
    </div>
  </div>

  <h3>三種情境共通的對策</h3>
  <p>**無論哪個情境**，公司都應該做的三件事：</p>
  <p>① **品牌資產持續累積**：Podcast、IG、SEO 文不能停（內容是危機時的緩衝）。</p>
  <p>② **法律與合規護欄**：借址登記 SOP 要請法律顧問定期檢視。</p>
  <p>③ **客戶留存系統化**：續約率比拓客重要，續約自動化系統 Q2 必須收尾。</p>
</section>

<!-- ──────── 10. 光光的真心話 ──────── -->
<section class="slide">
  <h2 class="section-title">光光的真心話</h2>
  <p class="section-sub">這頁不是報告，是想跟股東說的話</p>

  <div class="heart">
    <p>過去這一年，我把太多時間花在「**證明系統可以運作**」，但其實股東各位早就相信了。**現在我要證明的是「系統運作起來能帶來什麼結果」。**這個轉換我自己做得有點慢，今天會議的目的之一，是把這個轉換的時間表拉緊。</p>
    <p>我也誠實說：作為一個 ENFP、又是音樂人、又是 Podcast 主持人、又是 NLP 老師、又是 BNI 顧問⋯⋯我自己有時候會被「太多角色」分散。**光合創學需要我成為的那個版本，跟我內在最享受的那個版本，不完全一樣。**這也是為什麼今天會把「擴編 vs 不擴編」放上來討論—— 我需要股東幫我設一個邊界，讓我可以放心地把某些事情交出去。</p>
    <p>最後，謝謝各位股東的耐心。從 2023 年開始到現在，光合創學能走到「自動化開始發芽」的這一步，是因為各位願意陪我熬過初期那段什麼都沒有的時間。下一年，我希望能讓你們看見成果，而不只是承諾。</p>
  </div>
</section>

<!-- ──────── 11. 結語 ──────── -->
<section class="slide">
  <h2 class="section-title">結語 · 今天討論的議程</h2>
  <p class="section-sub">會議目標 + 留下時間給開放討論</p>

  <p class="lead">如果今天會議結束時，這幾件事有結論，就算成功：</p>

  <table>
    <tr><th>議題</th><th>類型</th></tr>
    <tr><td>第二空間 vs 深耕第一空間</td><td>決策</td></tr>
    <tr><td>擴編全職 vs 兼職協作</td><td>決策</td></tr>
    <tr><td>課程定價雙軌 vs 單軌</td><td>決策</td></tr>
    <tr><td>加密貨幣策略邊界</td><td>確認</td></tr>
    <tr><td>年度行銷預算範圍</td><td>決策</td></tr>
    <tr><td>引薦／資源協助意願</td><td>承諾</td></tr>
    <tr><td>下次會議時間</td><td>排定</td></tr>
  </table>

  <h3>會議流程建議</h3>
  <ul class="clean">
    <li><span class="when">10 分</span><div>光光簡報前 6 頁（我們是誰、績效、系統建設、業務線）</div></li>
    <li><span class="when">30 分</span><div>策略岔路逐項討論（每個 7–8 分鐘）</div></li>
    <li><span class="when">15 分</span><div>風險與請求討論</div></li>
    <li><span class="when">15 分</span><div>情境模擬與對策共識</div></li>
    <li><span class="when">10 分</span><div>開放討論（股東想加什麼議題都可以）</div></li>
    <li><span class="when">5 分</span><div>下次會議時間 + 會議結論回顧</div></li>
  </ul>

  <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--line); text-align: center;">
    <p style="margin:0;color:var(--muted);font-size:13px;">光合創學股份有限公司</p>
    <p style="margin:0;color:var(--muted);font-size:12px;">林政緯（光光）· kkstudio1984@gmail.com</p>
  </div>
</section>

</div>
</body>
</html>
`
