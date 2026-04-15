export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import VisitorList from '@/components/visitors/VisitorList'
import { startOfDay, endOfDay } from 'date-fns'

export default async function VisitorsPage() {
  const supabase = await createClient()
  const today = new Date()
  const todayStart = startOfDay(today).toISOString()
  const todayEnd = endOfDay(today).toISOString()

  // Today's visitors
  const { data: todayVisitors } = await supabase
    .from('visitor_logs')
    .select('*, host_client:space_clients(organization:organizations(name))')
    .gte('check_in_time', todayStart)
    .lte('check_in_time', todayEnd)
    .order('check_in_time', { ascending: false })

  // Currently inside (not checked out)
  const insideCount = (todayVisitors || []).filter((v) => !(v as { check_out_time: string | null }).check_out_time).length

  // Last 7 days history
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: history } = await supabase
    .from('visitor_logs')
    .select('*, host_client:space_clients(organization:organizations(name))')
    .lt('check_in_time', todayStart)
    .gte('check_in_time', sevenDaysAgo.toISOString())
    .order('check_in_time', { ascending: false })
    .limit(100)

  // Client options for host picker
  const { data: clients } = await supabase
    .from('space_clients')
    .select('id, organization:organizations(name)')
    .eq('stage', '服務中')
    .order('created_at', { ascending: false })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="訪客登記"
        subtitle="三院空間訪客進出紀錄"
        moduleColor="bg-sky-500"
      />
      <VisitorList
        todayVisitors={todayVisitors || []}
        insideCount={insideCount}
        history={history || []}
        clients={(clients || []).map((c) => ({
          id: (c as { id: string }).id,
          name: (c as unknown as { organization: { name: string } | null }).organization?.name || '—',
        }))}
      />
    </div>
  )
}
