// ── 股東會議簡報分享 endpoint ─────────────────────────────────
// 受 token 保護的公開頁，股東手機點連結即看。
// URL: /api/share/board/2026q2?token=XXXXXXXXXXXX
//
// Token 來源（按優先順序）：
//   1. process.env.SHARE_BOARD_TOKEN（可在 Vercel 設定後輪替）
//   2. 程式碼內的 FALLBACK_TOKEN（會議結束後 commit 改新值即廢舊連結）
//
// 設計考量：
// - 不擋 Google 索引也沒用，因為 token 不對直接 404，且回應頭加 X-Robots-Tag
// - middleware.ts 已將 /api/share 加入不擋登入白名單
// - 不寫 email_logs／不依賴 Resend，純 HTML 回應

import { NextRequest } from 'next/server'
import { PRESENTATION_HTML_2026Q2 } from '@/lib/board-presentations/2026q2'

const FALLBACK_TOKEN = 'gh2026q2x9k4'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const expected = process.env.SHARE_BOARD_TOKEN || FALLBACK_TOKEN

  if (!token || token !== expected) {
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
