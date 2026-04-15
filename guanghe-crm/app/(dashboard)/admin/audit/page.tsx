export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import AuditLogsTable from '@/components/admin/AuditLogsTable'

export default async function AuditPage() {
  const supabase = await createClient()

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, user:profiles(name, email)')
    .order('changed_at', { ascending: false })
    .limit(200)

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="操作軌跡"
        subtitle="系統關鍵欄位變更紀錄（最近 200 筆）"
        moduleColor="bg-stone-500"
      />
      <AuditLogsTable logs={logs || []} />
    </div>
  )
}
