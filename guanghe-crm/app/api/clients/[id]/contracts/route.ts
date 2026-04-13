import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addMonths, format } from 'date-fns'

const CYCLE_MONTHS: Record<string, number> = {
  '月繳': 1,
  '季繳': 3,
  '半年繳': 6,
  '年繳': 12,
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('space_client_id', id)
      .order('start_date', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/clients/[id]/contracts]', error)
    return NextResponse.json({ error: '載入合約失敗' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await req.json()

    const {
      contractType, paymentCycle, startDate, endDate,
      monthlyRent, depositAmount,
    } = body

    // Create contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        space_client_id: id,
        contract_type: contractType,
        payment_cycle: paymentCycle,
        start_date: startDate,
        end_date: endDate,
        monthly_rent: parseInt(monthlyRent),
        deposit_amount: depositAmount ? parseInt(depositAmount) : 0,
        deposit_status: '未收',
      })
      .select()
      .single()

    if (contractError) throw contractError

    // Auto-generate payment records
    const cycleMonths = CYCLE_MONTHS[paymentCycle] || 1
    const amount = parseInt(monthlyRent) * cycleMonths
    const payments: Array<{
      space_client_id: string
      contract_id: string
      due_date: string
      amount: number
      status: string
      escalation_level: string
    }> = []
    let current = new Date(startDate)
    const end = new Date(endDate)

    while (current < end) {
      payments.push({
        space_client_id: id,
        contract_id: contract.id,
        due_date: format(current, 'yyyy-MM-dd'),
        amount,
        status: '未收',
        escalation_level: '正常',
      })
      current = addMonths(current, cycleMonths)
    }

    if (payments.length > 0) {
      const { error: payError } = await supabase
        .from('payments')
        .insert(payments)
      if (payError) throw payError
    }

    return NextResponse.json({ contract, paymentsCreated: payments.length }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/clients/[id]/contracts]', error)
    return NextResponse.json({ error: '新增合約失敗' }, { status: 500 })
  }
}
