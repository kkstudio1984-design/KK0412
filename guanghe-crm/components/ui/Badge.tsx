import { KycStatus, PaymentStatus, Stage } from '@/lib/types'

const STAGE_STYLE: Record<Stage, string> = {
  '初步詢問':  'bg-gray-100 text-gray-600 border-gray-200',
  'KYC審核中': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '已簽約':    'bg-blue-50 text-blue-700 border-blue-200',
  '服務中':    'bg-green-50 text-green-700 border-green-200',
  '退租中':    'bg-orange-50 text-orange-700 border-orange-200',
  '已結案':    'bg-purple-50 text-purple-700 border-purple-200',
  '已流失':    'bg-red-50 text-red-600 border-red-200',
}

const KYC_STYLE: Record<KycStatus, string> = {
  '通過': 'bg-green-50 text-green-700 border-green-200',
  '異常': 'bg-red-50 text-red-700 border-red-200',
  '待查': 'bg-gray-50 text-gray-600 border-gray-200',
}

const PAYMENT_STYLE: Record<PaymentStatus, string> = {
  '已收': 'bg-green-50 text-green-700 border-green-200',
  '逾期': 'bg-red-50 text-red-700 border-red-200',
  '未收': 'bg-gray-50 text-gray-500 border-gray-200',
}

interface StageBadgeProps { stage: Stage }
interface KycBadgeProps { status: KycStatus }
interface PaymentBadgeProps { status: PaymentStatus }

const base = 'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border'

export function StageBadge({ stage }: StageBadgeProps) {
  return <span className={`${base} ${STAGE_STYLE[stage]}`}>{stage}</span>
}

export function KycBadge({ status }: KycBadgeProps) {
  return <span className={`${base} ${KYC_STYLE[status]}`}>{status}</span>
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  return <span className={`${base} ${PAYMENT_STYLE[status]}`}>{status}</span>
}
