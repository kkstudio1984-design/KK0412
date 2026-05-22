// Sentry browser-side initialisation.
// 在沒設 NEXT_PUBLIC_SENTRY_DSN 時完全 no-op、不影響 dev / preview。
// 光光照 vault「40 課程/00 戰略/Sentry 整合 SOP.md」設好 env 後即開始接收 error。

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    // 10% trace sampling — 第一個月先低、有需要再調高
    tracesSampleRate: 0.1,
    // 出錯時 100% 錄 session replay，平時 5% sample
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.replayIntegration({
        // PII 防護：所有文字遮蔽（合約金額、客戶資料）+ 所有媒體 block（簽名圖）
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // 環境標籤
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  })
}
