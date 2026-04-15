export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/ui/PageHeader'
import SeatGrid from '@/components/seats/SeatGrid'

export default async function SeatsPage() {
  const supabase = await createClient()

  const { data: seats } = await supabase
    .from('seats')
    .select('*')
    .eq('is_active', true)
    .order('seat_number')

  // Current occupancy (not checked out)
  const { data: occupancy } = await supabase
    .from('seat_occupancy')
    .select('*, space_client:space_clients(organization:organizations(name))')
    .is('check_out_time', null)

  // Active clients for picker
  const { data: clients } = await supabase
    .from('space_clients')
    .select('id, service_type, organization:organizations(name)')
    .eq('stage', '服務中')

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <PageHeader
        title="座位管理"
        subtitle="即時座位佔用狀況"
        moduleColor="bg-amber-500"
      />
      <SeatGrid
        seats={seats || []}
        occupancy={occupancy || []}
        clients={(clients || []).map((c) => ({
          id: (c as { id: string }).id,
          serviceType: (c as { service_type: string }).service_type,
          name: (c as unknown as { organization: { name: string } | null }).organization?.name || '—',
        }))}
      />
    </div>
  )
}
