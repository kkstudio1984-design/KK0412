'use client'

import { Droppable } from '@hello-pangea/dnd'
import { ClientWithOrg, Stage } from '@/lib/types'
import ClientCard from './ClientCard'

interface Props {
  stage: Stage
  clients: ClientWithOrg[]
}

const STAGE_COLORS: Record<Stage, string> = {
  '初步詢問':  'border-t-gray-400',
  'KYC審核中': 'border-t-yellow-400',
  '已簽約':    'border-t-blue-400',
  '服務中':    'border-t-green-500',
  '退租中':    'border-t-orange-400',
  '已結案':    'border-t-purple-400',
  '已流失':    'border-t-red-400',
}

export default function KanbanColumn({ stage, clients }: Props) {
  return (
    <div className={`flex flex-col w-60 shrink-0 bg-gray-50 rounded-lg border-t-4 ${STAGE_COLORS[stage]}`}>
      {/* 欄位標題 */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-sm font-semibold text-gray-700">{stage}</span>
        <span className="text-xs bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {clients.length}
        </span>
      </div>

      {/* 卡片列表 */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-2 pb-2 space-y-2 min-h-24 transition-colors ${
              snapshot.isDraggingOver ? 'bg-blue-50' : ''
            }`}
          >
            {clients.map((client, index) => (
              <ClientCard key={client.id} client={client} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
