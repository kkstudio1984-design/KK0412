'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Lead, LeadStage } from '@/lib/types'
import LeadCard from './LeadCard'

interface Props {
  stage: LeadStage
  leads: Lead[]
}

const STAGE_ACCENT: Record<LeadStage, { border: string; dot: string }> = {
  '初步接觸': { border: 'border-t-stone-400', dot: 'bg-stone-400' },
  '需求確認': { border: 'border-t-amber-500', dot: 'bg-amber-500' },
  '報價中':   { border: 'border-t-sky-500', dot: 'bg-sky-500' },
  '成交':     { border: 'border-t-emerald-500', dot: 'bg-emerald-500' },
  '流失':     { border: 'border-t-rose-400', dot: 'bg-rose-400' },
}

export default function LeadPipelineColumn({ stage, leads }: Props) {
  const accent = STAGE_ACCENT[stage]

  return (
    <div className={`flex flex-col w-64 shrink-0 bg-stone-50/80 rounded-xl border border-stone-200/60 border-t-[3px] ${accent.border}`}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
          <span className="text-sm font-semibold text-stone-700">{stage}</span>
        </div>
        <span className="text-xs bg-white border border-stone-200 text-stone-500 rounded-full px-2 py-0.5 font-semibold min-w-[1.5rem] text-center tabular-nums shadow-sm">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 px-2 pb-2.5 space-y-2.5 min-h-28 rounded-b-xl ${
              snapshot.isDraggingOver ? 'bg-amber-50/50' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <LeadCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
