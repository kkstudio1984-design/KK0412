import { NextResponse } from 'next/server'
import { sendDailyDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await sendDailyDigest([
    { title: '合約即將到期：王小明工作室', message: '合約於 2026-05-14 到期，剩 7 天，請盡快聯繫續約。', type: 'urgent', link: '/clients/test-id' },
    { title: '退租啟動：陳大華', message: '客戶已通知本月底退租，請啟動退租 SOP。', type: 'urgent', link: '/clients/test-id-2' },
    { title: '合約到期提醒：林志玲設計', message: '合約於 2026-06-06 到期，剩 30 天。', type: 'warning', link: '/clients/test-id-3' },
    { title: '收款升級：張三會計事務所', message: '逾期 14 天，建議升級為「電話催繳」流程。', type: 'warning', link: '/clients/test-id-4' },
    { title: '合約 60 天到期預警：李四貿易', message: '合約於 2026-07-06 到期，剩 60 天，可開始準備續約方案。', type: 'info', link: '/clients/test-id-5' },
  ])
  return NextResponse.json({ test: true, result })
}
