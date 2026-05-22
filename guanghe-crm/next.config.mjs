/** @type {import('next').NextConfig} */

import { withSentryConfig } from '@sentry/nextjs'

// Security headers — kept conservative to avoid breaking 3rd party integrations
// CSP intentionally omitted here — Supabase + Vercel + Google fonts need tuned allowlisting
// and a too-strict CSP can break auth flow silently. Add back when time permits.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

// Sentry：只在設了 SENTRY_DSN 時 wrap、否則 export 原本 config 維持 dev 行為。
// SOP 見 vault「40 課程/00 戰略/Sentry 整合 SOP.md」。
const sentryEnabled = !!process.env.SENTRY_DSN

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // build 時 silent 訊息（CI 環境保留輸出）
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // client bundle 也上傳 source map、讓 client-side error 解析出正確 stack
      widenClientFileUpload: true,
      // 不對外曝光 source map（隱藏 .map 路徑）
      hideSourceMaps: true,
      // 不在 production bundle 暴露 Sentry 內部 logger
      disableLogger: true,
    })
  : nextConfig
