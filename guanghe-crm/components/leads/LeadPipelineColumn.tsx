'use client'

import { Droppable } from '@hello-pangea/dnd'
import { Lead, LeadStage } from '@/lib/types'
import LeadCard from './LeadCard'

interface Props {
  stage: LeadStage
  leads: Lead[]
}

const STAGE_STYLE: Record<LeadStage, { color: string; bg: string }> = {
  '初步接觸': { color: '#a8a29e', bg: 'rgba(168,162,158,0.08)' },
  '需求確認': { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  '報價中':   { color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  '成交':     { color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  '流失':     { color: '#fb7185', bg: 'rgba(251,113,133,0.08)' },
}

export default function LeadPipelineColumn({ stage, leads }: Props) {
  const style = STAGE_STYLE[stage]

  return (
    <div
      className="flex flex-col w-64 shrink-0 rounded-xl"
      style={{
        background: '#111',
        border: '1px solid #222',
        borderTop: `3px solid ${style.color}`,
      }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: style.color, boxShadow: `0 0 8px ${style.color}60` }} />
          <span className="text-sm font-semibold" style={{ color: style.color }}>{stage}</span>
        </div>
        <span
          className="text-xs rounded-full px-2 py-0.5 font-semibold min-w-[1.5rem] text-center tabular-nums"
          style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}30` }}
        >
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 px-2 pb-2.5 space-y-2.5 min-h-28 rounded-b-xl"
            style={{
              background: snapshot.isDraggingOver ? 'rgba(217,119,6,0.05)' : 'transparent',
            }}
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
