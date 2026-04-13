import { createClient } from './supabase/server'
import { ClientWithOrg, ClientDetail, DashboardData } from './types'
import { getMonthRange, getOverdueDays } from './utils'
import { format } from 'date-fns'

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
      payments(*)
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
    payments: (c.payments || []).map((p: any) => ({
      id: p.id,
      spaceClientId: p.space_client_id,
      dueDate: p.due_date,
      amount: p.amount,
      status: p.status,
      paidAt: p.paid_at,
      createdAt: p.created_at,
    })),
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const supabase = await createClient()
  const { start, end } = getMonthRange()
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')

  // Active count
  const { count: activeCount } = await supabase
    .from('space_clients')
    .select('*', { count: 'exact', head: true })
    .eq('stage', '服務中')

  // Monthly due
  const { data: dueData } = await supabase
    .from('payments')
    .select('amount')
    .gte('due_date', startStr)
    .lte('due_date', endStr)

  const monthlyDue = (dueData || []).reduce((sum: number, p: any) => sum + p.amount, 0)

  // Monthly collected
  const { data: collectedData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', '已收')
    .gte('paid_at', startStr)
    .lte('paid_at', endStr)

  const monthlyCollected = (collectedData || []).reduce((sum: number, p: any) => sum + p.amount, 0)

  // Overdue payments
  const { data: overduePayments } = await supabase
    .from('payments')
    .select(`
      id,
      due_date,
      amount,
      space_client:space_clients(
        organization:organizations(name)
      )
    `)
    .eq('status', '逾期')
    .order('due_date', { ascending: true })

  const overdueList = (overduePayments || []).map((p: any) => ({
    paymentId: p.id,
    orgName: p.space_client?.organization?.name || '未知',
    dueDate: p.due_date,
    amount: p.amount,
    overdueDays: getOverdueDays(p.due_date),
  }))

  return {
    activeCount: activeCount || 0,
    monthlyDue,
    monthlyCollected,
    gap: monthlyDue - monthlyCollected,
    overdueList,
  }
}
