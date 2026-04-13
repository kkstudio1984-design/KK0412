import { createClient } from './supabase/server'
import { ClientWithOrg, ClientDetail, DashboardData, MailRecord, OffboardingRecord, Lead, Sponsorship, RevenueRecord, SubsidyTracking, Expense } from './types'
import { getMonthRange, getOverdueDays } from './utils'
import { addDays, differenceInDays, format, startOfMonth, endOfMonth } from 'date-fns'

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

  return clients.map((c: any) => ({
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
    organization: {
      id: c.organization.id,
      name: c.organization.name,
      taxId: c.organization.tax_id,
      contactName: c.organization.contact_name,
      contactPhone: c.organization.contact_phone,
      contactEmail: c.organization.contact_email,
      contactLine: c.organization.contact_line,
      source: c.organization.source,
      notes: c.organization.notes,
      createdAt: c.organization.created_at,
      updatedAt: c.organization.updated_at,
    },
    kycChecks: (c.kyc_checks || []).map((k: any) => ({
      id: k.id,
      spaceClientId: k.space_client_id,
      checkType: k.check_type,
      status: k.status,
      checkedAt: k.checked_at,
    })),
    hasOverduePayment: (c.payments || []).some((p: any) => p.status === '逾期'),
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
    .single()

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
      id: c.organization.id,
      name: c.organization.name,
      taxId: c.organization.tax_id,
      contactName: c.organization.contact_name,
      contactPhone: c.organization.contact_phone,
      contactEmail: c.organization.contact_email,
      contactLine: c.organization.contact_line,
      source: c.organization.source,
      notes: c.organization.notes,
      createdAt: c.organization.created_at,
      updatedAt: c.organization.updated_at,
    },
    kycChecks: (c.kyc_checks || []).map((k: any) => ({
      id: k.id,
      spaceClientId: k.space_client_id,
      checkType: k.check_type,
      status: k.status,
      checkedAt: k.checked_at,
      overrideReason: k.override_reason ?? null,
    })),
    payments: (c.payments || []).map((p: any) => ({
      id: p.id,
      spaceClientId: p.space_client_id,
      contractId: p.contract_id ?? null,
      dueDate: p.due_date,
      amount: p.amount,
      status: p.status,
      paidAt: p.paid_at,
      escalationLevel: p.escalation_level ?? undefined,
      escalationUpdatedAt: p.escalation_updated_at ?? null,
      createdAt: p.created_at,
    })),
    documents: ((c as any).client_documents || []).map((d: any) => ({
      id: d.id,
      spaceClientId: d.space_client_id,
      documentType: d.document_type,
      required: d.required,
      status: d.status,
      submittedAt: d.submitted_at,
      notes: d.notes,
    })),
    contracts: (c.contracts || []).map((ct: any) => ({
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
    })),
    mailRecords: (c.mail_records || []).map((m: any): MailRecord => ({
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
    offboardingRecords: (c.offboarding_records || []).map((o: any): OffboardingRecord => ({
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

  const urgentMail = (urgentMailData || []).map((m: any) => ({
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

  const kycOverdue = (kycOverdueData || []).map((c: any) => ({
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

  const followUpToday = (followUpData || []).map((c: any) => ({
    clientId: c.id,
    clientName: c.organization?.name || '未知',
    followUpDate: c.follow_up_date,
    nextAction: c.next_action,
  }))

  // Overdue payments with escalation
  const { data: overdueData } = await supabase
    .from('payments')
    .select('id, due_date, amount, escalation_level, space_client:space_clients(organization:organizations(name))')
    .eq('status', '逾期')
    .order('due_date', { ascending: true })

  const overduePayments = (overdueData || []).map((p: any) => ({
    paymentId: p.id,
    orgName: p.space_client?.organization?.name || '未知',
    dueDate: p.due_date,
    amount: p.amount,
    overdueDays: differenceInDays(new Date(), new Date(p.due_date)),
    escalationLevel: p.escalation_level || '正常',
  }))

  // KYC renewal due (beneficial_owner_verified_at > 365 days)
  const { data: renewalData } = await supabase
    .from('space_clients')
    .select('beneficial_owner_verified_at, organization:organizations(name)')
    .eq('service_type', '借址登記')
    .eq('stage', '服務中')
    .not('beneficial_owner_verified_at', 'is', null)
    .lt('beneficial_owner_verified_at', new Date(Date.now() - 365 * 86400000).toISOString())

  const kycRenewalDue = (renewalData || []).map((c: any) => ({
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

  const monthlyDue = (dueData || []).reduce((sum: number, p: any) => sum + p.amount, 0)

  const { data: collectedData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)

  const monthlyCollected = (collectedData || []).reduce((sum: number, p: any) => sum + p.amount, 0)

  // Revenue by service type this month
  const { data: revenueByTypeData } = await supabase
    .from('payments')
    .select('amount, space_client:space_clients(service_type)')
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)

  const revenueMap: Record<string, number> = {}
  for (const p of (revenueByTypeData || [])) {
    const type = (p as any).space_client?.service_type || '其他'
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

  const cashFlow90Days = (cashFlowData || []).reduce((sum: number, p: any) => sum + p.amount, 0)

  // Total deposits held
  const { data: depositData } = await supabase
    .from('contracts')
    .select('deposit_amount')
    .eq('deposit_status', '已收')

  const totalDepositsHeld = (depositData || []).reduce((sum: number, c: any) => sum + c.deposit_amount, 0)

  // ── Tier 3: 成長層 ──

  // Pipeline counts
  const { data: pipelineData } = await supabase
    .from('space_clients')
    .select('stage')

  const pipelineMap: Record<string, number> = {}
  for (const c of (pipelineData || [])) {
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
  for (const o of (sourceData || [])) {
    sourceMap[o.source] = (sourceMap[o.source] || 0) + 1
  }
  const sourceAnalysis = Object.entries(sourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count)

  // Seat utilization
  const { data: seatData } = await supabase
    .from('space_clients')
    .select('assigned_seats')
    .eq('stage', '服務中')

  const sold = (seatData || []).reduce((sum: number, c: any) => sum + (c.assigned_seats || 0), 0)

  return {
    urgentMail,
    kycOverdue,
    followUpToday,
    overduePayments,
    kycRenewalDue,
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

  return data.map((l: any) => ({
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
    .single()

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

  return data.map((s: any) => ({
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
  return (data || []).map((r: any) => ({
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
  return (data || []).map((s: any) => ({
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
  return (data || []).map((e: any) => ({
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
  for (const r of (revenueData || [])) {
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
  for (const e of (expenseData || [])) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    totalExpenses += e.amount
  }

  // Active subsidies
  const { data: subsidyData } = await supabase
    .from('subsidy_tracking')
    .select('annual_amount, application_status, disbursement_status')
    .in('application_status', ['核准'])

  const totalSubsidy = (subsidyData || []).reduce((sum: number, s: any) => sum + s.annual_amount, 0)
  const disbursed = (subsidyData || []).filter((s: any) => s.disbursement_status === '全額撥款').reduce((sum: number, s: any) => sum + s.annual_amount, 0)

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
