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
export type EscalationLevel = '正常' | '提醒' | '催告' | '存證信函' | '退租啟動'
export type DocumentStatus = '未繳' | '已繳' | '待補正'
export type MailType = '掛號' | '平信' | '法院文書'
export type PickupStatus = '待領取' | '已領取' | '已退回'

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
  overrideReason?: string | null
}

export type ClientDocument = {
  id: string
  spaceClientId: string
  documentType: string
  required: boolean
  status: DocumentStatus
  submittedAt: string | null
  notes: string | null
}

export type MailRecord = {
  id: string
  spaceClientId: string
  receivedDate: string
  mailType: MailType
  trackingNumber: string | null
  sender: string
  pickupStatus: PickupStatus
  notifiedAt: string | null
  finalNoticeAt: string | null
  pickedUpAt: string | null
}

export type Payment = {
  id: string
  spaceClientId: string
  contractId?: string | null
  dueDate: string
  amount: number
  status: PaymentStatus
  paidAt: string | null
  escalationLevel?: EscalationLevel
  escalationUpdatedAt?: string | null
  createdAt: string
}

export type PaymentCycle = '月繳' | '季繳' | '半年繳' | '年繳'
export type DepositStatus = '未收' | '已收' | '已退'

export type Contract = {
  id: string
  spaceClientId: string
  contractType: string
  paymentCycle: PaymentCycle
  startDate: string
  endDate: string
  monthlyRent: number
  depositAmount: number
  depositStatus: DepositStatus
  isNotarized: boolean
  notarizedAt: string | null
}

// ── Offboarding ───────────────────────────────────────

export type MigrationStatus = '待遷出' | '已通知' | '逾期未遷' | '已確認遷出'
export type SettlementStatus = '待結算' | '已結算'
export type RefundStatus = '待退' | '部分扣抵' | '已退' | '全額沒收'
export type OffboardingStatus = '進行中' | '已結案'

export type OffboardingRecord = {
  id: string
  spaceClientId: string
  requestDate: string
  contractEndDate: string
  earlyTermination: boolean
  penaltyAmount: number | null
  settlementStatus: SettlementStatus
  addressMigrationStatus: MigrationStatus
  migrationDeadline: string
  migrationConfirmedAt: string | null
  depositRefundStatus: RefundStatus
  depositRefundAmount: number | null
  depositDeductionReason: string | null
  status: OffboardingStatus
  closedAt: string | null
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
  isHighRiskKyc?: boolean
  blacklistFlag?: boolean
  isDisabilityPartner?: boolean
  lostReason?: string | null
  lostAt?: string | null
  beneficialOwnerName?: string | null
  beneficialOwnerVerifiedAt?: string | null
  organization: Organization
  kycChecks?: KycCheck[]
  payments?: Payment[]
  documents?: ClientDocument[]
  hasOverduePayment?: boolean
}

export type ClientDetail = ClientWithOrg & {
  kycChecks: KycCheck[]
  payments: Payment[]
  documents: ClientDocument[]
  contracts?: Contract[]
  mailRecords?: MailRecord[]
  offboardingRecords?: OffboardingRecord[]
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
  // Tier 1: 救火層
  urgentMail: { clientName: string; mailType: string; receivedDate: string; daysPending: number }[]
  kycOverdue: { clientName: string; stage: string; daysSinceUpdate: number }[]
  followUpToday: { clientId: string; clientName: string; followUpDate: string; nextAction: string | null }[]
  overduePayments: { paymentId: string; orgName: string; dueDate: string; amount: number; overdueDays: number; escalationLevel: string }[]
  kycRenewalDue: { clientName: string; lastVerified: string; daysSince: number }[]

  // Tier 2: 生存層
  monthlyDue: number
  monthlyCollected: number
  gap: number
  revenueByType: { type: string; amount: number }[]
  cashFlow90Days: number
  totalDepositsHeld: number

  // Tier 3: 成長層
  pipelineCounts: { stage: string; count: number }[]
  conversionRate: { signed: number; inquiries: number; rate: number }
  avgDealCycle: number
  sourceAnalysis: { source: string; count: number }[]
  seatUtilization: { sold: number; total: number; rate: number }
}

// ── M3 Sales Enums ────────────────────────────

export type LeadChannel = 'BNI' | '蒲公英' | 'ESG企業' | '線上分享會' | '自來客' | '轉介'
export const LEAD_CHANNELS: LeadChannel[] = ['BNI', '蒲公英', 'ESG企業', '線上分享會', '自來客', '轉介']

export type LeadInterest = '借址登記' | '工位' | '場地' | '專案接案' | '企業培訓' | 'ESG贊助' | '其他'
export const LEAD_INTERESTS: LeadInterest[] = ['借址登記', '工位', '場地', '專案接案', '企業培訓', 'ESG贊助', '其他']

export type LeadStage = '初步接觸' | '需求確認' | '報價中' | '成交' | '流失'
export const LEAD_STAGES: LeadStage[] = ['初步接觸', '需求確認', '報價中', '成交', '流失']

export type SponsorshipTier = '種子級' | '成長級' | '共融級'
export const SPONSORSHIP_TIERS: SponsorshipTier[] = ['種子級', '成長級', '共融級']

export type SponsorshipStatus = '洽談中' | '已簽約' | '執行中' | '已到期'
export const SPONSORSHIP_STATUSES: SponsorshipStatus[] = ['洽談中', '已簽約', '執行中', '已到期']

// ── M3 Models ─────────────────────────────────

export type Lead = {
  id: string
  orgId: string | null
  contactName: string
  contactInfo: string | null
  channel: LeadChannel
  interest: LeadInterest
  stage: LeadStage
  followUpDate: string | null
  notes: string | null
  convertedTo: string | null
  createdAt: string
  updatedAt: string
  organization?: Organization | null
}

export type Sponsorship = {
  id: string
  orgId: string
  tier: SponsorshipTier
  annualAmount: number
  startDate: string
  endDate: string
  deliverables: string | null
  status: SponsorshipStatus
  createdAt: string
  updatedAt: string
  organization?: Organization
}

// ── M4 Finance Enums ──────────────────────────

export type RevenueModule = 'M1空間' | 'M2專案' | 'M3贊助' | 'M5培訓'
export type RevenueCategory = '借址' | '工位' | '場地' | '專案' | '培訓' | '贊助' | '其他'
export const REVENUE_CATEGORIES: RevenueCategory[] = ['借址', '工位', '場地', '專案', '培訓', '贊助', '其他']

export type ApplicationStatus = '未申請' | '已申請' | '審核中' | '核准' | '駁回'
export const APPLICATION_STATUSES: ApplicationStatus[] = ['未申請', '已申請', '審核中', '核准', '駁回']

export type DisbursementStatus = '未撥款' | '部分撥款' | '全額撥款'
export const DISBURSEMENT_STATUSES: DisbursementStatus[] = ['未撥款', '部分撥款', '全額撥款']

export type ExpenseCategory = '租金' | '水電' | '人事' | '設備' | '行銷' | '其他'
export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['租金', '水電', '人事', '設備', '行銷', '其他']

// ── M4 Models ─────────────────────────────────

export type RevenueRecord = {
  id: string
  sourceModule: RevenueModule
  sourceId: string | null
  amount: number
  revenueDate: string
  category: RevenueCategory
  status: string
  description: string | null
  createdAt: string
}

export type SubsidyTracking = {
  id: string
  subsidyName: string
  agency: string
  annualAmount: number
  applicationStatus: ApplicationStatus
  disbursementStatus: DisbursementStatus
  relatedPartners: string[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type Expense = {
  id: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  description: string
  receiptUrl: string | null
  createdAt: string
}

// ── M2 Project Enums ──────────────────────────

export type ProjectType = 'AI影片' | 'SEO配圖' | '社群經營' | '手心共影'
export const PROJECT_TYPES: ProjectType[] = ['AI影片', 'SEO配圖', '社群經營', '手心共影']

export type ProjectStatus = '洽談中' | '進行中' | '待驗收' | '已結案' | '已取消'
export const PROJECT_STATUSES: ProjectStatus[] = ['洽談中', '進行中', '待驗收', '已結案', '已取消']

export type TaskStatus = '待分配' | '進行中' | '待審核' | '完成' | '退回'
export const TASK_STATUSES: TaskStatus[] = ['待分配', '進行中', '待審核', '完成', '退回']

export type EarningStatus = '待結算' | '已累積' | '已支付'

// ── M2 Models ─────────────────────────────────

export type Project = {
  id: string
  orgId: string
  name: string
  projectType: ProjectType
  status: ProjectStatus
  budget: number
  startDate: string | null
  deadline: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  organization?: Organization
  tasks?: Task[]
}

export type Task = {
  id: string
  projectId: string
  partnerId: string | null
  title: string
  status: TaskStatus
  dueDate: string | null
  outputUrl: string | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
}

export type PartnerEarning = {
  id: string
  partnerId: string
  taskId: string | null
  amount: number
  status: EarningStatus
  paidAt: string | null
  createdAt: string
}

// ── M5 Training Enums ─────────────────────────

export type CourseType = '同理心體驗' | '企業培訓' | 'AI工具工作坊' | '夥伴內訓'
export const COURSE_TYPES: CourseType[] = ['同理心體驗', '企業培訓', 'AI工具工作坊', '夥伴內訓']

export type SessionStatus = '規劃中' | '報名中' | '已額滿' | '已結束' | '已取消'
export const SESSION_STATUSES: SessionStatus[] = ['規劃中', '報名中', '已額滿', '已結束', '已取消']

export type EnrollmentPaymentStatus = '未付' | '已付' | '已退費'

// ── M5 Models ─────────────────────────────────

export type Course = {
  id: string
  name: string
  courseType: CourseType
  durationHours: number
  price: number
  maxParticipants: number
  description: string | null
  createdAt: string
  sessions?: CourseSession[]
}

export type CourseSession = {
  id: string
  courseId: string
  sessionDate: string
  startTime: string | null
  location: string | null
  orgId: string | null
  status: SessionStatus
  actualParticipants: number | null
  revenue: number | null
  createdAt: string
  courseName?: string
  enrollmentCount?: number
}

export type Enrollment = {
  id: string
  sessionId: string
  participantName: string
  participantEmail: string | null
  orgId: string | null
  paymentStatus: EnrollmentPaymentStatus
  createdAt: string
}

// ── M6 AI Strategy Enums ──────────────────────

export type ToolStatus = '使用中' | '評估中' | '已棄用'
export const TOOL_STATUSES: ToolStatus[] = ['使用中', '評估中', '已棄用']

export type TrainingType = '基礎班' | '進階班' | '專項培訓'
export const TRAINING_TYPES: TrainingType[] = ['基礎班', '進階班', '專項培訓']

export type TrainingRecordStatus = '未開始' | '進行中' | '已完成'

// ── M6 Models ─────────────────────────────────

export type AiTool = {
  id: string
  name: string
  purpose: string | null
  usedByModules: string[]
  costMonthly: number | null
  status: ToolStatus
  createdAt: string
}

export type TrainingRecord = {
  id: string
  partnerId: string
  trainingType: TrainingType
  toolName: string | null
  completedAt: string | null
  status: TrainingRecordStatus
  assessmentScore: number | null
  createdAt: string
}

export type AiAgent = {
  id: string
  name: string
  purpose: string | null
  targetModule: string | null
  promptVersion: string | null
  lastUpdated: string | null
  performanceNotes: string | null
  createdAt: string
}
