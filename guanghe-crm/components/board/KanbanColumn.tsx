'use client'

import { Droppable } from '@hello-pangea/dnd'
import { ClientWithOrg, Stage } from '@/lib/types'
import ClientCard from './ClientCard'

interface Props {
  stage: Stage
  clients: ClientWithOrg[]
}

const STAGE_COLORS: Record<Stage, string> = {
  '初步詢問':  'border-t-slate-400',
  'KYC審核中': 'border-t-amber-400',
  '已簽約':    'border-t-sky-400',
  '服務中':    'border-t-emerald-500',
  '退租中':    'border-t-orange-400',
  '已結案':    'border-t-violet-400',
  '已流失':    'border-t-rose-400',
}

export default function KanbanColumn({ stage, clients }: Props) {
  return (
    <div className={`flex flex-col w-60 shrink-0 bg-white/70 rounded-xl border border-gray-100 border-t-4 shadow-sm ${STAGE_COLORS[stage]}`}>
      {/* 欄位標題 */}
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-sm font-semibold text-gray-700">{stage}</span>
        <span className="text-xs bg-gray-50 border border-gray-200 text-gray-500 rounded-full px-2 py-0.5 font-medium min-w-[1.5rem] text-center">
          {clients.length}
        </span>
      </div>

      {/* 卡片列表 */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-2 pb-2 space-y-2 min-h-24 rounded-b-xl transition-colors ${
              snapshot.isDraggingOver ? 'bg-amber-50/60' : ''
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
