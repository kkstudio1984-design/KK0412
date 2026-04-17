import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select(`
      id, signing_status, signing_token_expires_at, signed_at, signer_name,
      contract_type, start_date, end_date, monthly_rent, payment_cycle, deposit_amount,
      space_client:space_clients(
        id,
        organization:organizations(name, contact_name, tax_id)
      )
    `)
    .eq('signing_token', token)
    .single()

  if (error || !contract) {
    return NextResponse.json({ error: '連結無效或已過期' }, { status: 404 })
  }

  return NextResponse.json(contract)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const { signerName, action } = await req.json()
    // action: 'sign' | 'reject'

    const supabase = await createClient()

    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('id, signing_status, signing_token_expires_at')
      .eq('signing_token', token)
      .single()

    if (fetchError || !contract) {
      return NextResponse.json({ error: '連結無效' }, { status: 404 })
    }
    if (contract.signing_status !== '待簽署') {
      return NextResponse.json({ error: `合約${contract.signing_status}` }, { status: 409 })
    }
    if (contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()) {
      return NextResponse.json({ error: '簽署連結已過期' }, { status: 410 })
    }

    const signerIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    const newStatus = action === 'reject' ? '已拒絕' : '已簽署'

    const { error: updateError } = await supabase
      .from('contracts')
      .update({
        signing_status: newStatus,
        signer_name: signerName || null,
        signer_ip: signerIp,
        signed_at: new Date().toISOString(),
      })
      .eq('id', contract.id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (error) {
    return NextResponse.json({ error: '簽署失敗', details: String(error) }, { status: 500 })
  }
}
