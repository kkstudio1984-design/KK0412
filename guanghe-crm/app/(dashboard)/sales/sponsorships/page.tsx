export const dynamic = 'force-dynamic'

import SponsorshipList from '@/components/sponsorships/SponsorshipList'
import { fetchSponsorships } from '@/lib/queries'

export default async function SponsorshipsPage() {
  const sponsorships = await fetchSponsorships()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900">ESG 贊助管理</h1>
        <p className="text-xs text-gray-400 mt-0.5">共 {sponsorships.length} 筆贊助</p>
      </div>

      <SponsorshipList initialSponsorships={sponsorships} />
    </div>
  )
}
