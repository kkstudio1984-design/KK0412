// ── Enums ──────────────────────────────────────────────

export type Stage =
  | '初步詢問'
  | 'KYC審核中'
  | '已簽約'
  | '服務中'
  | '退租中'
  | '已結案'
  | '已流失'

export const STAGES: Stage[] = [
  '初步詢問',
  'KYC審核中',
  '已簽約',
  '服務中',
  '退租中',
  '已結案',
  '已流失',
]

export type ServiceType = '借址登記' | '共享工位' | '場地租借'

export type Source =
  | 'LINE表單'
  | 'BNI轉介'
  | '記帳師轉介'
  | '蒲公英'
  | 'ESG'
  | '自來客'
  | '其他'

export const SOURCES: Source[] = [
  'LINE表單',
  'BNI轉介',
  '記帳師轉介',
  '蒲公英',
  'ESG',
  '自來客',
  '其他',
]

export type CheckType =
  | '商工登記'
  | '司法院裁判書'
  | '動產擔保'
  | 'Google搜尋'
  | '實質受益人審查'

export const KYC_CHECK_TYPES: CheckType[] = [
  '商工登記',
  '司法院裁判書',
  '動產擔保',
  'Google搜尋',
  '實質受益人審查',
]

export type KycStatus = '通過' | '異常' | '待查'
export type PaymentStatus = '已收' | '未收' | '逾期'

// ── Models ─────────────────────────────────────────────

export type Organization = {
  id: string
  name: string
  taxId: string | null
  contactName: string
  contactPhone: string | null
  contactEmail: string | null
  contactLine: string | null
  source: Source
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type KycCheck = {
  id: string
  spaceClientId: string
  checkType: CheckType
  status: KycStatus
  checkedAt: string
}

export type Payment = {
  id: string
  spaceClientId: string
  dueDate: string
  amount: number
  status: PaymentStatus
  paidAt: string | null
  createdAt: string
}

// ── Composite types ────────────────────────────────────

export type ClientWithOrg = {
  id: string
  orgId: string
  serviceType: ServiceType
  plan: string | null
  monthlyFee: number
  stage: Stage
  nextAction: string | null
  followUpDate: string | null
  redFlags: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
  organization: Organization
  kycChecks?: KycCheck[]
  payments?: Payment[]
  hasOverduePayment?: boolean
}

export type ClientDetail = ClientWithOrg & {
  kycChecks: KycCheck[]
  payments: Payment[]
}

// ── Dashboard ──────────────────────────────────────────

export type OverdueItem = {
  paymentId: string
  orgName: string
  dueDate: string
  amount: number
  overdueDays: number
}

export type DashboardData = {
  activeCount: number
  monthlyDue: number
  monthlyCollected: number
  gap: number
  overdueList: OverdueItem[]
}
