'use client'

import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Lead, LeadStage, LEAD_STAGES } from '@/lib/types'
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh'
import LeadPipelineColumn from './LeadPipelineColumn'
import { useRole } from '@/components/providers/RoleProvider'

interface Props {
  initialLeads: Lead[]
}

export default function LeadPipelineBoard({ initialLeads }: Props) {
  useRealtimeRefresh(['leads'])
  const { canEdit } = useRole()
  const [leads, setLeads] = useState<Lead[]>(initialLeads)

  const grouped = LEAD_STAGES.reduce<Record<LeadStage, Lead[]>>((acc, stage) => {
    acc[stage] = leads.filter((l) => l.stage === stage)
    return acc
  }, {} as Record<LeadStage, Lead[]>)

  const onDragEnd = async (result: DropResult) => {
    if (!canEdit) {
      toast.error('您無編輯權限')
      return
    }
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStage = destination.droppableId as LeadStage

    // Optimistic update
    const prev = leads
    setLeads((ls) =>
      ls.map((l) => (l.id === draggableId ? { ...l, stage: newStage } : l))
    )

    try {
      const res = await fetch(`/api/leads/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '更新失敗')
        setLeads(prev) // rollback
        return
      }

      toast.success(`已移至「${newStage}」`)
    } catch {
      toast.error('網路錯誤，請重試')
      setLeads(prev)
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1">
        {LEAD_STAGES.map((stage) => (
          <LeadPipelineColumn key={stage} stage={stage} leads={grouped[stage]} />
        ))}
      </div>
    </DragDropContext>
  )
}
