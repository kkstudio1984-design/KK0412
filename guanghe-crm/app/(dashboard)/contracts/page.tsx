export const dynamic = 'force-dynamic'

import { fetchAllContracts } from '@/lib/queries'
import ContractTable from '@/components/contracts/ContractTable'
import PageHeader from '@/components/ui/PageHeader'

export default async function ContractsPage() {
  const contracts = await fetchAllContracts()

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <PageHeader
        title="合約管理"
        subtitle="所有客戶合約狀態總覽"
        moduleColor="bg-amber-500"
      />
      <ContractTable contracts={contracts} />
    </div>
  )
}
