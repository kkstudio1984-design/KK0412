// ── Email Logs Cleanup Cron ────────────────────────────────────
// 每週日 04:00 跑：刪除 90 天前 status='skipped' 的 email_logs 紀錄、避免表膨脹。
//
// 為什麼只刪 'skipped'：
//   'sent' / 'failed' 是真實業務紀錄、客戶若爭議「我沒收到合約通知」可以從這查、
//   保留至少 1 年（會計法定保存期亦對齊）。
//   'skipped' 是 dev / preview 環境沒設 EMAIL_FROM / RESEND_API_KEY 時的安全網
//   產物、3 個月後沒有稽核價值、可清除。
//
// 觸發來源：Vercel cron schedule（vercel.json 設）、需設 CRON_SECRET。
// 也可手動 trigger 補跑：
//   curl 'https://prod-url/api/cron/cleanup-email-logs' -H 'Authorization: Bearer <CRON_SECRET>'

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const RETENTION_DAYS = 90

export async function GET(req: NextRequest) {
  // Cron 鑑權
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)
  const cutoffIso = cutoffDate.toISOString()

  try {
    // 先 count、回報刪了幾筆方便監控
    const { count: targetCount } = await supabase
      .from('email_logs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'skipped')
      .lt('created_at', cutoffIso)

    const { error: deleteErr } = await supabase
      .from('email_logs')
      .delete()
      .eq('status', 'skipped')
      .lt('created_at', cutoffIso)

    if (deleteErr) throw deleteErr

    return NextResponse.json({
      ok: true,
      deleted: targetCount ?? 0,
      retentionDays: RETENTION_DAYS,
      cutoffDate: cutoffIso,
    })
  } catch (e: unknown) {
    console.error('[cleanup-email-logs] failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown error' },
      { status: 500 }
    )
  }
}
