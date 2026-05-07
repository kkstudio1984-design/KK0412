import { NextResponse } from 'next/server'
import { sendDailyDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await sendDailyDigest([
    {
      title: '測試：合約即將到期：王小明工作室',
      message: '合約於 2026-05-14 到期，剩 7 天，請盡快聯繫續約。',
      type: 'contract_expiring',
      link: '/clients/test-id',
    },
    {
      title: '測試：KYC 超時未完成：陳大華',
      message: '客戶尚未完成 KYC 流程已超過 14 天。',
      type: 'kyc_overdue',
      link: '/clients/test-id-2',
    },
  ])
  return NextResponse.json({ test: true, result })
}
