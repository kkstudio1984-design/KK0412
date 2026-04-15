// DB row types — these mirror the Postgres schema exactly (snake_case)
// Used internally for snake→camel mapping in lib/queries.ts

import type {
  Stage, ServiceType, Source, CheckType, KycStatus, PaymentStatus,
  EscalationLevel, DocumentStatus, MailType, PickupStatus, PaymentCycle,
  DepositStatus, MigrationStatus, SettlementStatus, RefundStatus, OffboardingStatus,
  LeadChannel, LeadInterest, LeadStage, SponsorshipTier, SponsorshipStatus,
  RevenueModule, RevenueCategory, ApplicationStatus, DisbursementStatus,
  ExpenseCategory, ProjectType, ProjectStatus, TaskStatus, CourseType,
  SessionStatus, EnrollmentPaymentStatus, ToolStatus, TrainingType,
  TrainingRecordStatus,
} from './types'

export type OrganizationRow = {
  id: string
  name: string
  tax_id: string | null
  contact_name: string
  contact_phone: string | null
  contact_email: string | null
  contact_line: string | null
  representative_address: string | null
  representative_id_number: string | null
  org_type: string
  source: Source
  notes: string | null
  created_at: string
  updated_at: string
}

export type SpaceClientRow = {
  id: string
  org_id: string
  service_type: ServiceType
  plan: string | null
  monthly_fee: number
  stage: Stage
  next_action: string | null
  follow_up_date: string | null
  red_flags: string[] | null
  is_disability_partner: boolean
  lost_reason: string | null
  lost_at: string | null
  is_high_risk_kyc: boolean
  blacklist_flag: boolean
  beneficial_owner_name: string | null
  beneficial_owner_verified_at: string | null
  assigned_seats: number
  access_cards_issued: number
  access_card_numbers: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type KycCheckRow = {
  id: string
  space_client_id: string
  check_type: CheckType
  status: KycStatus
  override_reason: string | null
  checked_at: string
}

export type ClientDocumentRow = {
  id: string
  space_client_id: string
  document_type: string
  required: boolean
  status: DocumentStatus
  submitted_at: string | null
  notes: string | null
}

export type ContractRow = {
  id: string
  space_client_id: string
  contract_type: string
  payment_cycle: PaymentCycle
  start_date: string
  end_date: string
  monthly_rent: number
  deposit_amount: number
  deposit_status: DepositStatus
  is_notarized: boolean
  notarized_at: string | null
}

export type PaymentRow = {
  id: string
  space_client_id: string
  contract_id: string | null
  due_date: string
  amount: number
  status: PaymentStatus
  paid_at: string | null
  escalation_level: EscalationLevel | null
  escalation_updated_at: string | null
  created_at: string
}

export type MailRecordRow = {
  id: string
  space_client_id: string
  received_date: string
  mail_type: MailType
  tracking_number: string | null
  sender: string
  pickup_status: PickupStatus
  notified_at: string | null
  final_notice_at: string | null
  picked_up_at: string | null
}

export type OffboardingRecordRow = {
  id: string
  space_client_id: string
  request_date: string
  contract_end_date: string
  early_termination: boolean
  penalty_amount: number | null
  settlement_status: SettlementStatus
  address_migration_status: MigrationStatus
  migration_deadline: string
  migration_confirmed_at: string | null
  deposit_refund_status: RefundStatus
  deposit_refund_amount: number | null
  deposit_deduction_reason: string | null
  status: OffboardingStatus
  closed_at: string | null
}

export type LeadRow = {
  id: string
  org_id: string | null
  contact_name: string
  contact_info: string | null
  channel: LeadChannel
  interest: LeadInterest
  stage: LeadStage
  follow_up_date: string | null
  notes: string | null
  converted_to: string | null
  created_at: string
  updated_at: string
}

export type SponsorshipRow = {
  id: string
  org_id: string
  tier: SponsorshipTier
  annual_amount: number
  start_date: string
  end_date: string
  deliverables: string | null
  status: SponsorshipStatus
  created_at: string
  updated_at: string
}

export type RevenueRecordRow = {
  id: string
  source_module: RevenueModule
  source_id: string | null
  amount: number
  revenue_date: string
  category: RevenueCategory
  status: string
  description: string | null
  created_at: string
}

export type SubsidyRow = {
  id: string
  subsidy_name: string
  agency: string
  annual_amount: number
  application_status: ApplicationStatus
  disbursement_status: DisbursementStatus
  related_partners: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ExpenseRow = {
  id: string
  category: ExpenseCategory
  amount: number
  expense_date: string
  description: string
  receipt_url: string | null
  created_at: string
}

export type ProjectRow = {
  id: string
  org_id: string
  name: string
  project_type: ProjectType
  status: ProjectStatus
  budget: number
  start_date: string | null
  deadline: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type TaskRow = {
  id: string
  project_id: string
  partner_id: string | null
  title: string
  status: TaskStatus
  due_date: string | null
  output_url: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

export type CourseRow = {
  id: string
  name: string
  course_type: CourseType
  duration_hours: number
  price: number
  max_participants: number
  description: string | null
  created_at: string
  updated_at: string
}

export type CourseSessionRow = {
  id: string
  course_id: string
  session_date: string
  start_time: string | null
  location: string | null
  org_id: string | null
  status: SessionStatus
  actual_participants: number | null
  revenue: number | null
  created_at: string
  updated_at: string
}

export type EnrollmentRow = {
  id: string
  session_id: string
  participant_name: string
  participant_email: string | null
  org_id: string | null
  payment_status: EnrollmentPaymentStatus
  created_at: string
}

export type AiToolRow = {
  id: string
  name: string
  purpose: string | null
  used_by_modules: string[] | null
  cost_monthly: number | null
  status: ToolStatus
  created_at: string
  updated_at: string
}

export type AgentRow = {
  id: string
  name: string
  purpose: string | null
  target_module: string | null
  prompt_version: string | null
  last_updated: string | null
  performance_notes: string | null
  created_at: string
  updated_at: string
}

export type TrainingRecordRow = {
  id: string
  partner_id: string
  training_type: TrainingType
  tool_name: string | null
  completed_at: string | null
  status: TrainingRecordStatus
  assessment_score: number | null
  created_at: string
}

// Joined rows (with nested relations from Supabase .select('*, relation:relations(*)'))
export type SpaceClientWithJoinsRow = SpaceClientRow & {
  organization?: OrganizationRow
  kyc_checks?: KycCheckRow[]
  payments?: Partial<PaymentRow>[]
  client_documents?: ClientDocumentRow[]
  contracts?: ContractRow[]
  mail_records?: MailRecordRow[]
  offboarding_records?: OffboardingRecordRow[]
}

export type LeadWithOrgRow = LeadRow & {
  organization?: OrganizationRow | null
}

export type SponsorshipWithOrgRow = SponsorshipRow & {
  organization?: OrganizationRow
}

export type ProjectWithJoinsRow = ProjectRow & {
  organization?: Partial<OrganizationRow>
  tasks?: Partial<TaskRow>[]
}

export type CourseWithJoinsRow = CourseRow & {
  course_sessions?: (CourseSessionRow & { enrollments?: Partial<EnrollmentRow>[] })[]
}

export type TrainingRecordWithPartnerRow = TrainingRecordRow & {
  partner?: { name: string } | null
}
