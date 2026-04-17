import { createClient } from './supabase/server'
import { ClientWithOrg, ClientDetail, DashboardData, MailRecord, OffboardingRecord, Lead, Sponsorship, RevenueRecord, SubsidyTracking, Expense, Project } from './types'
import { getMonthRange } from './utils'
import { addDays, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns'
import type {
  SpaceClientWithJoinsRow, KycCheckRow, ClientDocumentRow, PaymentRow,
  ContractRow, MailRecordRow, OffboardingRecordRow, LeadWithOrgRow,
  SponsorshipWithOrgRow, RevenueRecordRow, SubsidyRow, ExpenseRow,
  ProjectWithJoinsRow, CourseWithJoinsRow, AiToolRow, AgentRow,
  TrainingRecordWithPartnerRow, CourseSessionRow, EnrollmentRow, TaskRow,
  OrganizationRow,
} from './db-types'

export async function fetchClients(): Promise<ClientWithOrg[]> {
  const supabase = await createClient()

  const { data: clients, error } = await supabase
    .from('space_clients')
    .select(`
      *,
      organization:organizations(*),
      kyc_checks(*),
      payments(status)
    `)
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!clients) return []

  return (clients as SpaceClientWithJoinsRow[]).map((c): ClientWithOrg => ({
    id: c.id,
    orgId: c.org_id,
    serviceType: c.service_type as ClientWithOrg['serviceType'],
    plan: c.plan,
    monthlyFee: c.monthly_fee,
    stage: c.stage as ClientWithOrg['stage'],
    nextAction: c.next_action,
    followUpDate: c.follow_up_date,
    redFlags: c.red_flags || [],
    notes: c.notes,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    isHighRiskKyc: c.is_high_risk_kyc ?? false,
    blacklistFlag: c.blacklist_flag ?? false,
    isDisabilityPartner: c.is_disability_partner ?? false,
    organization: {
      id: c.organization!.id,
      name: c.organization!.name,
      taxId: c.organization!.tax_id,
      contactName: c.organization!.contact_name,
      contactPhone: c.organization!.contact_phone,
      contactEmail: c.organization!.contact_email,
      contactLine: c.organization!.contact_line,
      source: c.organization!.source as import('./types').Source,
      notes: c.organization!.notes,
      createdAt: c.organization!.created_at,
      updatedAt: c.organization!.updated_at,
    },
    kycChecks: (c.kyc_checks || []).map((k: KycCheckRow) => ({
      id: k.id,
      spaceClientId: k.space_client_id,
      checkType: k.check_type as import('./types').CheckType,
      status: k.status as import('./types').KycStatus,
      checkedAt: k.checked_at,
    })),
    hasOverduePayment: (c.payments || []).some((p: Partial<PaymentRow>) => p.status === '逾期'),
  }))
}

export async function fetchClient(id: string): Promise<ClientDetail | null> {
  const supabase = await createClient()

  const { data: c, error } = await supabase
    .from('space_clients')
    .select(`
      *,
      organization:organizations(*),
      kyc_checks(*),
      payments(*),
      client_documents(*),
      contracts(*),
      mail_records(*),
      offboarding_records(*)
    `)
    .eq('id', id)
    .single<SpaceClientWithJoinsRow>()

  if (error || !c) return null

  return {
    id: c.id,
    orgId: c.org_id,
    serviceType: c.service_type,
    plan: c.plan,
    monthlyFee: c.monthly_fee,
    stage: c.stage,
    nextAction: c.next_action,
    followUpDate: c.follow_up_date,
    redFlags: c.red_flags || [],
    notes: c.notes,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    isHighRiskKyc: c.is_high_risk_kyc ?? false,
    blacklistFlag: c.blacklist_flag ?? false,
    isDisabilityPartner: c.is_disability_partner ?? false,
    lostReason: c.lost_reason ?? null,
    lostAt: c.lost_at ?? null,
    beneficialOwnerName: c.beneficial_owner_name ?? null,
    beneficialOwnerVerifiedAt: c.beneficial_owner_verified_at ?? null,
    organization: {
      id: c.organization!.id,
      name: c.organization!.name,
      taxId: c.organization!.tax_id,
      contactName: c.organization!.contact_name,
      contactPhone: c.organization!.contact_phone,
      contactEmail: c.organization!.contact_email,
      contactLine: c.organization!.contact_line,
      source: c.organization!.source,
      notes: c.organization!.notes,
      createdAt: c.organization!.created_at,
      updatedAt: c.organization!.updated_at,
    },
    kycChecks: (c.kyc_checks || []).map((k: KycCheckRow) => ({
      id: k.id,
      spaceClientId: k.space_client_id,
      checkType: k.check_type,
      status: k.status,
      checkedAt: k.checked_at,
      overrideReason: k.override_reason ?? null,
    })),
    payments: (c.payments || []).map((p: Partial<PaymentRow>) => ({
      id: p.id as string,
      spaceClientId: p.space_client_id as string,
      contractId: p.contract_id ?? null,
      dueDate: p.due_date as string,
      amount: p.amount as number,
      status: p.status as PaymentRow['status'],
      paidAt: p.paid_at as string | null,
      escalationLevel: p.escalation_level ?? undefined,
      escalationUpdatedAt: p.escalation_updated_at ?? null,
      createdAt: p.created_at as string,
    })),
    documents: (c.client_documents || []).map((d: ClientDocumentRow) => ({
      id: d.id,
      spaceClientId: d.space_client_id,
      documentType: d.document_type,
      required: d.required,
      status: d.status,
      submittedAt: d.submitted_at,
      notes: d.notes,
    })),
    contracts: (c.contracts || []).map((ct: ContractRow) => ({
      id: ct.id,
      spaceClientId: ct.space_client_id,
      contractType: ct.contract_type,
      paymentCycle: ct.payment_cycle,
      startDate: ct.start_date,
      endDate: ct.end_date,
      monthlyRent: ct.monthly_rent,
      depositAmount: ct.deposit_amount,
      depositStatus: ct.deposit_status,
      isNotarized: ct.is_notarized,
      notarizedAt: ct.notarized_at,
      signingStatus: (ct as any).signing_status ?? '未發送',
      signingToken: (ct as any).signing_token ?? null,
      signingTokenExpiresAt: (ct as any).signing_token_expires_at ?? null,
      signedAt: (ct as any).signed_at ?? null,
      signerName: (ct as any).signer_name ?? null,
    })),
    mailRecords: (c.mail_records || []).map((m: MailRecordRow): MailRecord => ({
      id: m.id,
      spaceClientId: m.space_client_id,
      receivedDate: m.received_date,
      mailType: m.mail_type,
      trackingNumber: m.tracking_number,
      sender: m.sender,
      pickupStatus: m.pickup_status,
      notifiedAt: m.notified_at,
      finalNoticeAt: m.final_notice_at,
      pickedUpAt: m.picked_up_at,
    })),
    offboardingRecords: (c.offboarding_records || []).map((o: OffboardingRecordRow): OffboardingRecord => ({
      id: o.id,
      spaceClientId: o.space_client_id,
      requestDate: o.request_date,
      contractEndDate: o.contract_end_date,
      earlyTermination: o.early_termination,
      penaltyAmount: o.penalty_amount,
      settlementStatus: o.settlement_status,
      addressMigrationStatus: o.address_migration_status,
      migrationDeadline: o.migration_deadline,
      migrationConfirmedAt: o.migration_confirmed_at,
      depositRefundStatus: o.deposit_refund_status,
      depositRefundAmount: o.deposit_refund_amount,
      depositDeductionReason: o.deposit_deduction_reason,
      status: o.status,
      closedAt: o.closed_at,
    })),
  }
}

// Narrow inline types for ad-hoc dashboard shapes
type UrgentMailJoinRow = {
  mail_type: string
  received_date: string
  space_client?: { organization?: { name?: string } | null } | null
}
type KycOverdueJoinRow = {
  id: string
  stage: string
  updated_at: string
  organization?: { name?: string } | null
}
type FollowUpJoinRow = {
  id: string
  follow_up_date: string | null
  next_action: string | null
  organization?: { name?: string } | null
}
type OverduePaymentJoinRow = {
  id: string
  due_date: string
  amount: number
  escalation_level: string | null
  space_client?: { organization?: { name?: string } | null } | null
}
type ExpiringContractJoinRow = {
  end_date: string
  contract_type: string
  space_client?: { organization?: { name?: string } | null } | null
}
type RenewalJoinRow = {
  beneficial_owner_verified_at: string
  organization?: { name?: string } | null
}
type RevenueByTypeJoinRow = {
  amount: number
  space_client?: { service_type?: string } | null
}

export async function fetchDashboard(): Promise<DashboardData> {
  const supabase = await createClient()
  const { start, end } = getMonthRange()
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const days90Str = format(addDays(new Date(), 90), 'yyyy-MM-dd')
  const days7ago = format(addDays(new Date(), -7), 'yyyy-MM-dd')

  // ── Tier 1: 救火層 ──

  // Urgent mail: 法院文書 pending OR any mail pending > 7 days
  const { data: urgentMailData } = await supabase
    .from('mail_records')
    .select('*, space_client:space_clients(organization:organizations(name))')
    .eq('pickup_status', '待領取')
    .or(`mail_type.eq.法院文書,received_date.lt.${days7ago}`)

  const urgentMail = ((urgentMailData || []) as unknown as UrgentMailJoinRow[]).map((m) => ({
    clientName: m.space_client?.organization?.name || '未知',
    mailType: m.mail_type,
    receivedDate: m.received_date,
    daysPending: differenceInDays(new Date(), new Date(m.received_date)),
  }))

  // KYC overdue: space_clients in KYC審核中 with updated_at > 7 days ago
  const { data: kycOverdueData } = await supabase
    .from('space_clients')
    .select('id, stage, updated_at, organization:organizations(name)')
    .eq('stage', 'KYC審核中')
    .lt('updated_at', new Date(Date.now() - 7 * 86400000).toISOString())

  const kycOverdue = ((kycOverdueData || []) as unknown as KycOverdueJoinRow[]).map((c) => ({
    clientName: c.organization?.name || '未知',
    stage: c.stage,
    daysSinceUpdate: differenceInDays(new Date(), new Date(c.updated_at)),
  }))

  // Follow-up today
  const { data: followUpData } = await supabase
    .from('space_clients')
    .select('id, follow_up_date, next_action, organization:organizations(name)')
    .lte('follow_up_date', todayStr)
    .not('follow_up_date', 'is', null)
    .not('stage', 'in', '("已結案","已流失")')

  const followUpToday = ((followUpData || []) as unknown as FollowUpJoinRow[]).map((c) => ({
    clientId: c.id,
    clientName: c.organization?.name || '未知',
    followUpDate: (c.follow_up_date ?? '') as string,
    nextAction: c.next_action,
  }))

  // Overdue payments with escalation
  const { data: overdueData } = await supabase
    .from('payments')
    .select('id, due_date, amount, escalation_level, space_client:space_clients(organization:organizations(name))')
    .eq('status', '逾期')
    .order('due_date', { ascending: true })

  const overduePayments = ((overdueData || []) as unknown as OverduePaymentJoinRow[]).map((p) => ({
    paymentId: p.id,
    orgName: p.space_client?.organization?.name || '未知',
    dueDate: p.due_date,
    amount: p.amount,
    overdueDays: differenceInDays(new Date(), new Date(p.due_date)),
    escalationLevel: p.escalation_level || '正常',
  }))

  // Contracts expiring within 30 days
  const days30Str = format(addDays(new Date(), 30), 'yyyy-MM-dd')
  const { data: expiringContracts } = await supabase
    .from('contracts')
    .select('end_date, contract_type, space_client:space_clients(organization:organizations(name))')
    .gte('end_date', todayStr)
    .lte('end_date', days30Str)

  const contractExpiringSoon = ((expiringContracts || []) as unknown as ExpiringContractJoinRow[]).map((c) => ({
    clientName: c.space_client?.organization?.name || '未知',
    contractType: c.contract_type,
    endDate: c.end_date,
    daysLeft: differenceInDays(new Date(c.end_date), new Date()),
  }))

  // KYC renewal due (beneficial_owner_verified_at > 365 days)
  const { data: renewalData } = await supabase
    .from('space_clients')
    .select('beneficial_owner_verified_at, organization:organizations(name)')
    .eq('service_type', '借址登記')
    .eq('stage', '服務中')
    .not('beneficial_owner_verified_at', 'is', null)
    .lt('beneficial_owner_verified_at', new Date(Date.now() - 365 * 86400000).toISOString())

  const kycRenewalDue = ((renewalData || []) as unknown as RenewalJoinRow[]).map((c) => ({
    clientName: c.organization?.name || '未知',
    lastVerified: c.beneficial_owner_verified_at,
    daysSince: differenceInDays(new Date(), new Date(c.beneficial_owner_verified_at)),
  }))

  // ── Tier 2: 生存層 ──

  const { data: dueData } = await supabase
    .from('payments')
    .select('amount')
    .gte('due_date', startStr)
    .lte('due_date', endStr)

  const monthlyDue = ((dueData || []) as { amount: number }[]).reduce((sum, p) => sum + p.amount, 0)

  const { data: collectedData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)

  const monthlyCollected = ((collectedData || []) as { amount: number }[]).reduce((sum, p) => sum + p.amount, 0)

  // Revenue by service type this month
  const { data: revenueByTypeData } = await supabase
    .from('payments')
    .select('amount, space_client:space_clients(service_type)')
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)

  const revenueMap: Record<string, number> = {}
  for (const p of ((revenueByTypeData || []) as unknown as RevenueByTypeJoinRow[])) {
    const type = p.space_client?.service_type || '其他'
    revenueMap[type] = (revenueMap[type] || 0) + p.amount
  }
  const revenueByType = Object.entries(revenueMap).map(([type, amount]) => ({ type, amount }))

  // Cash flow 90 days
  const { data: cashFlowData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', '未收')
    .gte('due_date', todayStr)
    .lte('due_date', days90Str)

  const cashFlow90Days = ((cashFlowData || []) as { amount: number }[]).reduce((sum, p) => sum + p.amount, 0)

  // Total deposits held
  const { data: depositData } = await supabase
    .from('contracts')
    .select('deposit_amount')
    .eq('deposit_status', '已收')

  const totalDepositsHeld = ((depositData || []) as { deposit_amount: number }[]).reduce((sum, c) => sum + c.deposit_amount, 0)

  // ── Tier 3: 成長層 ──

  // Pipeline counts
  const { data: pipelineData } = await supabase
    .from('space_clients')
    .select('stage')

  const pipelineMap: Record<string, number> = {}
  for (const c of ((pipelineData || []) as { stage: string }[])) {
    pipelineMap[c.stage] = (pipelineMap[c.stage] || 0) + 1
  }
  const STAGES = ['初步詢問', 'KYC審核中', '已簽約', '服務中', '退租中', '已結案', '已流失']
  const pipelineCounts = STAGES.map((stage) => ({ stage, count: pipelineMap[stage] || 0 }))

  // Conversion rate this month
  const { count: signedThisMonth } = await supabase
    .from('space_clients')
    .select('*', { count: 'exact', head: true })
    .eq('stage', '已簽約')
    .gte('updated_at', startStr)

  const { count: inquiriesThisMonth } = await supabase
    .from('space_clients')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startStr)

  const signed = signedThisMonth || 0
  const inquiries = inquiriesThisMonth || 0
  const rate = inquiries > 0 ? Math.round((signed / inquiries) * 100) : 0

  // Source analysis
  const { data: sourceData } = await supabase
    .from('organizations')
    .select('source')

  const sourceMap: Record<string, number> = {}
  for (const o of ((sourceData || []) as { source: string }[])) {
    sourceMap[o.source] = (sourceMap[o.source] || 0) + 1
  }
  const sourceAnalysis = Object.entries(sourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count)

  // Seat utilization
  const { data: seatData } = await supabase
    .from('space_clients')
    .select('assigned_seats')
    .eq('stage', '服務中')

  const sold = ((seatData || []) as { assigned_seats: number | null }[]).reduce((sum, c) => sum + (c.assigned_seats || 0), 0)

  return {
    urgentMail,
    kycOverdue,
    followUpToday,
    overduePayments,
    kycRenewalDue,
    contractExpiringSoon,
    monthlyDue,
    monthlyCollected,
    gap: monthlyDue - monthlyCollected,
    revenueByType,
    cashFlow90Days,
    totalDepositsHeld,
    pipelineCounts,
    conversionRate: { signed, inquiries, rate },
    avgDealCycle: 0, // TODO: calculate when we have enough data
    sourceAnalysis,
    seatUtilization: { sold, total: 40, rate: Math.round((sold / 40) * 100) },
  }
}

export async function fetchLeads(): Promise<Lead[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, organization:organizations(*)')
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data) return []

  return (data as LeadWithOrgRow[]).map((l) => ({
    id: l.id,
    orgId: l.org_id,
    contactName: l.contact_name,
    contactInfo: l.contact_info,
    channel: l.channel,
    interest: l.interest,
    stage: l.stage,
    followUpDate: l.follow_up_date,
    notes: l.notes,
    convertedTo: l.converted_to,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    organization: l.organization ? {
      id: l.organization.id,
      name: l.organization.name,
      taxId: l.organization.tax_id,
      contactName: l.organization.contact_name,
      contactPhone: l.organization.contact_phone,
      contactEmail: l.organization.contact_email,
      contactLine: l.organization.contact_line,
      source: l.organization.source,
      notes: l.organization.notes,
      createdAt: l.organization.created_at,
      updatedAt: l.organization.updated_at,
    } : null,
  }))
}

export async function fetchLead(id: string): Promise<Lead | null> {
  const supabase = await createClient()
  const { data: l, error } = await supabase
    .from('leads')
    .select('*, organization:organizations(*)')
    .eq('id', id)
    .single<LeadWithOrgRow>()

  if (error || !l) return null

  return {
    id: l.id,
    orgId: l.org_id,
    contactName: l.contact_name,
    contactInfo: l.contact_info,
    channel: l.channel,
    interest: l.interest,
    stage: l.stage,
    followUpDate: l.follow_up_date,
    notes: l.notes,
    convertedTo: l.converted_to,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    organization: l.organization ? {
      id: l.organization.id,
      name: l.organization.name,
      taxId: l.organization.tax_id,
      contactName: l.organization.contact_name,
      contactPhone: l.organization.contact_phone,
      contactEmail: l.organization.contact_email,
      contactLine: l.organization.contact_line,
      source: l.organization.source,
      notes: l.organization.notes,
      createdAt: l.organization.created_at,
      updatedAt: l.organization.updated_at,
    } : null,
  }
}

export async function fetchSponsorships(): Promise<Sponsorship[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sponsorships')
    .select('*, organization:organizations(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  return (data as SponsorshipWithOrgRow[]).map((s) => ({
    id: s.id,
    orgId: s.org_id,
    tier: s.tier,
    annualAmount: s.annual_amount,
    startDate: s.start_date,
    endDate: s.end_date,
    deliverables: s.deliverables,
    status: s.status,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    organization: s.organization ? {
      id: s.organization.id,
      name: s.organization.name,
      taxId: s.organization.tax_id,
      contactName: s.organization.contact_name,
      contactPhone: s.organization.contact_phone,
      contactEmail: s.organization.contact_email,
      contactLine: s.organization.contact_line,
      source: s.organization.source,
      notes: s.organization.notes,
      createdAt: s.organization.created_at,
      updatedAt: s.organization.updated_at,
    } : undefined,
  }))
}

// ── M4 Finance Queries ────────────────────────

export async function fetchRevenueRecords(): Promise<RevenueRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('revenue_records')
    .select('*')
    .order('revenue_date', { ascending: false })
  if (error) throw error
  return ((data || []) as RevenueRecordRow[]).map((r) => ({
    id: r.id,
    sourceModule: r.source_module,
    sourceId: r.source_id,
    amount: r.amount,
    revenueDate: r.revenue_date,
    category: r.category,
    status: r.status,
    description: r.description,
    createdAt: r.created_at,
  }))
}

export async function fetchSubsidies(): Promise<SubsidyTracking[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subsidy_tracking')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as SubsidyRow[]).map((s) => ({
    id: s.id,
    subsidyName: s.subsidy_name,
    agency: s.agency,
    annualAmount: s.annual_amount,
    applicationStatus: s.application_status,
    disbursementStatus: s.disbursement_status,
    relatedPartners: s.related_partners || [],
    notes: s.notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }))
}

export async function fetchExpenses(): Promise<Expense[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
  if (error) throw error
  return ((data || []) as ExpenseRow[]).map((e) => ({
    id: e.id,
    category: e.category,
    amount: e.amount,
    expenseDate: e.expense_date,
    description: e.description,
    receiptUrl: e.receipt_url,
    createdAt: e.created_at,
  }))
}

export async function fetchFinanceSummary() {
  const supabase = await createClient()
  const now = new Date()
  const startStr = format(startOfMonth(now), 'yyyy-MM-dd')
  const endStr = format(endOfMonth(now), 'yyyy-MM-dd')

  // Monthly revenue by category
  const { data: revenueData } = await supabase
    .from('revenue_records')
    .select('category, amount')
    .eq('status', '已收')
    .gte('revenue_date', startStr)
    .lte('revenue_date', endStr)

  const revenueByCategory: Record<string, number> = {}
  let totalRevenue = 0
  for (const r of ((revenueData || []) as { category: string; amount: number }[])) {
    revenueByCategory[r.category] = (revenueByCategory[r.category] || 0) + r.amount
    totalRevenue += r.amount
  }

  // Monthly expenses by category
  const { data: expenseData } = await supabase
    .from('expenses')
    .select('category, amount')
    .gte('expense_date', startStr)
    .lte('expense_date', endStr)

  const expenseByCategory: Record<string, number> = {}
  let totalExpenses = 0
  for (const e of ((expenseData || []) as { category: string; amount: number }[])) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    totalExpenses += e.amount
  }

  // Active subsidies
  const { data: subsidyData } = await supabase
    .from('subsidy_tracking')
    .select('annual_amount, application_status, disbursement_status')
    .in('application_status', ['核准'])

  type SubsidySummaryRow = { annual_amount: number; application_status: string; disbursement_status: string }
  const subsidies = (subsidyData || []) as SubsidySummaryRow[]
  const totalSubsidy = subsidies.reduce((sum, s) => sum + s.annual_amount, 0)
  const disbursed = subsidies.filter((s) => s.disbursement_status === '全額撥款').reduce((sum, s) => sum + s.annual_amount, 0)

  return {
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    revenueByCategory: Object.entries(revenueByCategory).map(([category, amount]) => ({ category, amount })),
    expenseByCategory: Object.entries(expenseByCategory).map(([category, amount]) => ({ category, amount })),
    totalSubsidy,
    subsidyDisbursed: disbursed,
  }
}

// ── M2 Project Queries ──────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*, organization:organizations(id, name, contact_name), tasks(id, status)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as ProjectWithJoinsRow[]).map((p) => ({
    id: p.id,
    orgId: p.org_id,
    name: p.name,
    projectType: p.project_type,
    status: p.status,
    budget: p.budget,
    startDate: p.start_date,
    deadline: p.deadline,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    organization: p.organization ? {
      id: p.organization.id as string,
      name: p.organization.name as string,
      contactName: p.organization.contact_name as string,
    } : undefined,
    tasks: (p.tasks || []).map((t: Partial<TaskRow>) => ({ id: t.id as string, status: t.status as string })),
  })) as unknown as Project[]
}

export async function fetchProject(id: string): Promise<Project | null> {
  const supabase = await createClient()
  const { data: p, error } = await supabase
    .from('projects')
    .select('*, organization:organizations(*), tasks(*)')
    .eq('id', id)
    .single<ProjectWithJoinsRow>()
  if (error || !p) return null
  return {
    id: p.id,
    orgId: p.org_id,
    name: p.name,
    projectType: p.project_type,
    status: p.status,
    budget: p.budget,
    startDate: p.start_date,
    deadline: p.deadline,
    notes: p.notes,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    organization: p.organization ? {
      id: p.organization.id as string,
      name: p.organization.name as string,
      taxId: p.organization.tax_id ?? null,
      contactName: p.organization.contact_name as string,
      contactPhone: p.organization.contact_phone ?? null,
      contactEmail: p.organization.contact_email ?? null,
      contactLine: p.organization.contact_line ?? null,
      source: p.organization.source as string,
      notes: p.organization.notes ?? null,
      createdAt: p.organization.created_at as string,
      updatedAt: p.organization.updated_at as string,
    } : undefined,
    tasks: (p.tasks || []).map((t: Partial<TaskRow>) => ({
      id: t.id as string,
      projectId: t.project_id as string,
      partnerId: t.partner_id ?? null,
      title: t.title as string,
      status: t.status as string,
      dueDate: t.due_date ?? null,
      outputUrl: t.output_url ?? null,
      reviewNotes: t.review_notes ?? null,
      createdAt: t.created_at as string,
      updatedAt: t.updated_at as string,
    })),
  } as unknown as Project
}

// ── M5 Training Queries ──────────────────────────

import type { Course } from './types'

type CourseListRow = {
  id: string
  name: string
  course_type: import('./types').CourseType
  duration_hours: number
  price: number
  max_participants: number
  description: string | null
  created_at: string
  course_sessions?: { id: string; status: import('./types').SessionStatus }[]
}

export async function fetchCourses(): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*, course_sessions(id, status)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as CourseListRow[]).map((c) => ({
    id: c.id, name: c.name, courseType: c.course_type,
    durationHours: c.duration_hours, price: c.price,
    maxParticipants: c.max_participants, description: c.description,
    createdAt: c.created_at,
    sessions: (c.course_sessions || []) as unknown as Course['sessions'],
  }))
}

export async function fetchCourse(id: string) {
  const supabase = await createClient()
  const { data: c, error } = await supabase
    .from('courses')
    .select('*, course_sessions(*, enrollments(id, payment_status))')
    .eq('id', id)
    .single<CourseWithJoinsRow>()
  if (error || !c) return null
  return {
    id: c.id, name: c.name, courseType: c.course_type,
    durationHours: c.duration_hours, price: c.price,
    maxParticipants: c.max_participants, description: c.description,
    createdAt: c.created_at,
    sessions: (c.course_sessions || []).map((s: CourseSessionRow & { enrollments?: Partial<EnrollmentRow>[] }) => ({
      id: s.id, courseId: s.course_id, sessionDate: s.session_date,
      startTime: s.start_time, location: s.location, orgId: s.org_id,
      status: s.status, actualParticipants: s.actual_participants,
      revenue: s.revenue, createdAt: s.created_at,
      enrollmentCount: (s.enrollments || []).length,
      enrollments: (s.enrollments || []).map((e: Partial<EnrollmentRow>) => ({
        id: e.id as string, paymentStatus: e.payment_status as string,
      })),
    })),
  }
}

// ── M6 AI Strategy Queries ──────────────────────

export async function fetchAiTools() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('ai_tools').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as AiToolRow[]).map((t) => ({
    id: t.id, name: t.name, purpose: t.purpose,
    usedByModules: t.used_by_modules || [], costMonthly: t.cost_monthly,
    status: t.status, createdAt: t.created_at,
  }))
}

export async function fetchAgents() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('agents').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as AgentRow[]).map((a) => ({
    id: a.id, name: a.name, purpose: a.purpose,
    targetModule: a.target_module, promptVersion: a.prompt_version,
    lastUpdated: a.last_updated, performanceNotes: a.performance_notes,
    createdAt: a.created_at,
  }))
}

export async function fetchTrainingRecords() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('training_records').select('*, partner:partners(name)').order('created_at', { ascending: false })
  if (error) throw error
  return ((data || []) as TrainingRecordWithPartnerRow[]).map((r) => ({
    id: r.id, partnerId: r.partner_id, trainingType: r.training_type,
    toolName: r.tool_name, completedAt: r.completed_at, status: r.status,
    assessmentScore: r.assessment_score, createdAt: r.created_at,
    partnerName: r.partner?.name || '未知',
  }))
}

// Suppress unused-import warning for OrganizationRow (used transitively via joined types)
export type { OrganizationRow }

// ── 合約總覽 ─────────────────────────────────────────
import type { Contract } from './types'

export type ContractWithClient = Contract & {
  clientId: string
  orgName: string
}

export async function fetchAllContracts(): Promise<ContractWithClient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      space_client:space_clients(
        id,
        organization:organizations(name)
      )
    `)
    .order('end_date', { ascending: true })

  if (error) throw error
  if (!data) return []

  return (data as any[]).map((ct) => ({
    id: ct.id,
    spaceClientId: ct.space_client_id,
    clientId: ct.space_client?.id ?? ct.space_client_id,
    orgName: ct.space_client?.organization?.name ?? '—',
    contractType: ct.contract_type,
    paymentCycle: ct.payment_cycle,
    startDate: ct.start_date,
    endDate: ct.end_date,
    monthlyRent: ct.monthly_rent,
    depositAmount: ct.deposit_amount,
    depositStatus: ct.deposit_status,
    isNotarized: ct.is_notarized,
    notarizedAt: ct.notarized_at,
    signingStatus: ct.signing_status ?? '未發送',
    signingToken: ct.signing_token ?? null,
    signingTokenExpiresAt: ct.signing_token_expires_at ?? null,
    signedAt: ct.signed_at ?? null,
    signerName: ct.signer_name ?? null,
  }))
}
