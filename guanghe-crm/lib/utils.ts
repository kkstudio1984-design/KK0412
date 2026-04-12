import { differenceInDays, endOfMonth, format, startOfMonth } from 'date-fns'

// ── 跟進日期 ───────────────────────────────────────────

export function getFollowUpColor(dateStr: string | null): string {
  if (!dateStr) return 'text-gray-400'
  const days = differenceInDays(new Date(dateStr), new Date())
  if (days >= 3) return 'text-green-600'
  if (days >= 1) return 'text-yellow-500'
  return 'text-red-500'
}

export function getFollowUpDotColor(dateStr: string | null): string {
  if (!dateStr) return 'bg-gray-300'
  const days = differenceInDays(new Date(dateStr), new Date())
  if (days >= 3) return 'bg-green-500'
  if (days >= 1) return 'bg-yellow-400'
  return 'bg-red-500'
}

export function getFollowUpLabel(dateStr: string | null): string {
  if (!dateStr) return '未設定'
  const days = differenceInDays(new Date(dateStr), new Date())
  if (days > 0) return `${days} 天後`
  if (days === 0) return '今天'
  return `逾期 ${Math.abs(days)} 天`
}

// ── 日期 ───────────────────────────────────────────────

export function getMonthRange() {
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return format(new Date(dateStr), 'yyyy/MM/dd')
}

// ── 金額 ───────────────────────────────────────────────

export function formatNTD(amount: number): string {
  return `NT$${amount.toLocaleString('zh-TW')}`
}

// ── 逾期天數 ───────────────────────────────────────────

export function getOverdueDays(dueDateStr: string): number {
  return Math.max(0, differenceInDays(new Date(), new Date(dueDateStr)))
}
