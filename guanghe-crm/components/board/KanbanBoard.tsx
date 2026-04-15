'use client'

import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClientWithOrg, Stage, STAGES } from '@/lib/types'
import KanbanColumn from './KanbanColumn'
import { downloadCSV } from '@/lib/csv'
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh'
import { useRole } from '@/components/providers/RoleProvider'

interface Props {
  initialClients: ClientWithOrg[]
}

export default function KanbanBoard({ initialClients }: Props) {
  useRealtimeRefresh(['space_clients', 'kyc_checks', 'payments'])
  const { canEdit } = useRole()
  const [clients, setClients] = useState<ClientWithOrg[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = searchQuery
    ? clients.filter(c =>
        c.organization.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organization.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.organization.taxId && c.organization.taxId.includes(searchQuery))
      )
    : clients

  const grouped = STAGES.reduce<Record<Stage, ClientWithOrg[]>>((acc, stage) => {
    acc[stage] = filtered.filter((c) => c.stage === stage)
    return acc
  }, {} as Record<Stage, ClientWithOrg[]>)

  const handleExport = () => {
    const headers = ['公司名稱', '聯絡人', '統編', '服務類型', '階段', '月費', '跟進日期', '紅旗']
    const rows = clients.map(c => [
      c.organization.name,
      c.organization.contactName,
      c.organization.taxId || '',
      c.serviceType,
      c.stage,
      String(c.monthlyFee),
      c.followUpDate || '',
      c.redFlags.join('、'),
    ])
    downloadCSV(`客戶清單_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
  }

  const onDragEnd = async (result: DropResult) => {
    if (!canEdit) {
      toast.error('您無編輯權限')
      return
    }
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
    <div>
      <div className="mb-3 px-1 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜尋公司名稱、聯絡人、統編..."
          className="w-full md:w-80 input-base"
        />
        <button onClick={handleExport} className="text-xs text-stone-500 hover:text-stone-700 px-3 py-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 whitespace-nowrap">
          匯出 CSV
        </button>
      </div>
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} clients={grouped[stage]} />
        ))}
      </div>
    </DragDropContext>
    </div>
  )
}
