// Sentry Node.js server-side initialisation（Next.js API routes / Server Components）。
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
