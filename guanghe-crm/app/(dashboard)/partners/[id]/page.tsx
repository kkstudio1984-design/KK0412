export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import PartnerDetail from '@/components/partners/PartnerDetail'

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: partner } = await supabase.from('partners').select('*').eq('id', id).single()
  if (!partner) notFound()

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('*, subsidy:subsidy_tracking(subsidy_name)')
    .eq('partner_id', id)
    .order('attendance_date', { ascending: false })
    .limit(50)

  const { data: earnings } = await supabase
    .from('partner_earnings')
    .select('*, task:tasks(title, project:projects(name))')
    .eq('partner_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: subsidies } = await supabase
    .from('subsidy_tracking')
    .select('id, subsidy_name')
    .order('subsidy_name')

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PageHeader
        title={(partner as { name: string }).name}
        subtitle="夥伴詳情"
        moduleColor="bg-pink-500"
        breadcrumbs={[{ label: '夥伴管理', href: '/partners' }]}
      />
      <PartnerDetail
        partner={partner}
        attendance={attendance || []}
        earnings={earnings || []}
        subsidies={subsidies || []}
      />
    </div>
  )
}
