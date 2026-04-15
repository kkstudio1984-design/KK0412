export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import SubsidyDetail from '@/components/finance/SubsidyDetail'

export default async function SubsidyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: subsidy } = await supabase.from('subsidy_tracking').select('*').eq('id', id).single()
  if (!subsidy) notFound()

  const { data: attendance } = await supabase
    .from('attendance_records')
    .select('*, partner:partners(name, disability_type)')
    .eq('subsidy_id', id)
    .order('attendance_date', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <PageHeader
        title={(subsidy as { subsidy_name: string }).subsidy_name}
        subtitle="補助核銷追蹤"
        moduleColor="bg-emerald-500"
        breadcrumbs={[{ label: '政府補助', href: '/finance/subsidies' }]}
        action={
          <a
            href={`/print/subsidy-reconciliation/${id}`}
            target="_blank"
            rel="noopener"
            className="btn-secondary"
          >
            列印核銷報表
          </a>
        }
      />
      <SubsidyDetail subsidy={subsidy} attendance={attendance || []} />
    </div>
  )
}
