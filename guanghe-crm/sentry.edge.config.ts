// Sentry Edge runtime initialisation（middleware.ts、edge API routes）。
// 沒設 SENTRY_DSN 時 no-op。

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || 'development',
  })
}
