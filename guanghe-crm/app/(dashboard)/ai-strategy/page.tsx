export const dynamic = 'force-dynamic'

import { fetchAiTools, fetchAgents, fetchTrainingRecords } from '@/lib/queries'
import AiToolList from '@/components/ai-strategy/AiToolList'
import AgentList from '@/components/ai-strategy/AgentList'
import TrainingRecordList from '@/components/ai-strategy/TrainingRecordList'
import PageHeader from '@/components/ui/PageHeader'

export default async function AiStrategyPage() {
  const [tools, agents, records] = await Promise.all([
    fetchAiTools(), fetchAgents(), fetchTrainingRecords(),
  ])

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="AI 戰略"
        subtitle="工具管理・Agent・夥伴培訓"
        moduleColor="bg-violet-500"
      />
      <AiToolList initialTools={tools} />
      <AgentList initialAgents={agents} />
      <TrainingRecordList initialRecords={records} />
    </div>
  )
}
