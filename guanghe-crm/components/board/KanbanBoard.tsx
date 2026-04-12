'use client'

import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClientWithOrg, Stage, STAGES } from '@/lib/types'
import KanbanColumn from './KanbanColumn'

interface Props {
  initialClients: ClientWithOrg[]
}

export default function KanbanBoard({ initialClients }: Props) {
  const [clients, setClients] = useState<ClientWithOrg[]>(initialClients)

  const grouped = STAGES.reduce<Record<Stage, ClientWithOrg[]>>((acc, stage) => {
    acc[stage] = clients.filter((c) => c.stage === stage)
    return acc
  }, {} as Record<Stage, ClientWithOrg[]>)

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const newStage = destination.droppableId as Stage
    const client = clients.find((c) => c.id === draggableId)
    if (!client) return

    // 前端 KYC 鎖定檢查
    if (newStage === '已簽約' && client.serviceType === '借址登記') {
      const allPassed = client.kycChecks?.every((k) => k.status === '通過')
      if (!allPassed) {
        toast.error('KYC 尚未全部通過，無法推進到已簽約')
        return
      }
    }

    // Optimistic update
    const prev = clients
    setClients((cs) =>
      cs.map((c) => (c.id === draggableId ? { ...c, stage: newStage } : c))
    )

    try {
      const res = await fetch(`/api/clients/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? '更新失敗')
        setClients(prev) // rollback
        return
      }

      toast.success(`已移至「${newStage}」`)
    } catch {
      toast.error('網路錯誤，請重試')
      setClients(prev)
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} clients={grouped[stage]} />
        ))}
      </div>
    </DragDropContext>
  )
}
