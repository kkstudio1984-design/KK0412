export const dynamic = 'force-dynamic'

import SponsorshipList from '@/components/sponsorships/SponsorshipList'
import PageHeader from '@/components/ui/PageHeader'
import { fetchSponsorships } from '@/lib/queries'

export default async function SponsorshipsPage() {
  const sponsorships = await fetchSponsorships()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PageHeader
        title="ESG 贊助合約"
        subtitle="種子級・成長級・共融級"
        moduleColor="bg-sky-500"
        breadcrumbs={[{ label: '銷售管線', href: '/sales' }]}
      />

      <SponsorshipList initialSponsorships={sponsorships} />
    </div>
  )
}
