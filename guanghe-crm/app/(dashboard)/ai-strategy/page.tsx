export const dynamic = 'force-dynamic'

import { fetchAiTools, fetchAgents, fetchTrainingRecords } from '@/lib/queries'
import AiToolList from '@/components/ai-strategy/AiToolList'
import AgentList from '@/components/ai-strategy/AgentList'
import TrainingRecordList from '@/components/ai-strategy/TrainingRecordList'

export default async function AiStrategyPage() {
  const [tools, agents, records] = await Promise.all([
    fetchAiTools(), fetchAgents(), fetchTrainingRecords(),
  ])

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-lg font-bold text-stone-800">AI 戰略</h1>
        <p className="text-xs text-stone-400 mt-0.5">工具管理・Agent・夥伴培訓</p>
      </div>
      <AiToolList initialTools={tools} />
      <AgentList initialAgents={agents} />
      <TrainingRecordList initialRecords={records} />
    </div>
  )
}
