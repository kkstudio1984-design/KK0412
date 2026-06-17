export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import PortalTokensManager from '@/components/admin/PortalTokensManager'

export default async function PortalTokensPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'operator'].includes(profile.role)) redirect('/')

  // 拉所有 portal tokens（含過期）+ 對應 client 名
  const { data: tokens } = await supabase
    .from('portal_tokens')
    .select(
      `
      token,
      space_client_id,
      expires_at,
      first_accessed_at,
      last_accessed_at,
      access_count,
      notes,
      created_at,
      space_clients (
        service_type,
        organizations ( name )
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100)

  // 拉所有 space_clients 給 generate form 選
  const { data: clients } = await supabase
    .from('space_clients')
    .select(
      `
      id,
      service_type,
      stage,
      organizations ( name )
    `
    )
    .order('created_at', { ascending: false })

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="客戶 Portal Token 管理"
        subtitle="為客戶產生一次性 magic link、自助查詢合約／繳款／KYC／月報預告（admin / operator）"
        moduleColor="bg-emerald-500"
      />
      <PortalTokensManager initialTokens={tokens || []} clients={clients || []} />
    </div>
  )
}
