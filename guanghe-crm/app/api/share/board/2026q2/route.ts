// ── 股東會議簡報分享 endpoint ─────────────────────────────────
// 受 token 保護的公開頁，股東手機點連結即看。
// URL: /api/share/board/2026q2?token=XXXXXXXXXXXX
//
// Token 來源：
//   process.env.SHARE_BOARD_TOKEN — 必須在 Vercel 設好，否則 production 一律 404。
//   舊版 source code 寫死 fallback 'gh2026q2x9k4' 已 2026-05-22 移除 — 該值已公開在
//   git history、不再具備安全性。如要繼續用該舊連結、可暫時把它設成 env 值；
//   建議直接 rotate 為新隨機字串（vault「股東入口 token rotation SOP.md」）。
//   dev 環境（NODE_ENV !== 'production'）保留一個 dev-only fallback 方便本機測試。
//
// 設計考量：
// - 不擋 Google 索引也沒用，因為 token 不對直接 404，且回應頭加 X-Robots-Tag
// - middleware.ts 已將 /api/share 加入不擋登入白名單
// - 不寫 email_logs／不依賴 Resend，純 HTML 回應

import { NextRequest } from 'next/server'
import { PRESENTATION_HTML_2026Q2 } from '@/lib/board-presentations/2026q2'

// dev-only fallback — 純本機測試用，production 不會 fall through 到這
const DEV_FALLBACK_TOKEN = 'dev-local-only'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const envToken = process.env.SHARE_BOARD_TOKEN
  const expected = envToken || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_TOKEN : null)

  if (!expected) {
    console.error('[share/board] SHARE_BOARD_TOKEN not set in production — refusing all access (404)')
  }

  if (!token || !expected || token !== expected) {
    return new Response(
      `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><title>404</title></head>
<body style="font-family:-apple-system,'PingFang TC',sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#0a0a0a;color:#888;">
<div style="text-align:center;"><p style="font-size:48px;margin:0;">⚠️</p><p style="margin:8px 0 0;">連結無效或已過期，請聯繫光光重新取得</p></div>
</body></html>`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      }
    )
  }

  return new Response(PRESENTATION_HTML_2026Q2, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
