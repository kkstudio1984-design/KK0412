'use client'

import { DragDropContext, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClientWithOrg, Stage, STAGES } from '@/lib/types'
import KanbanColumn from './KanbanColumn'
import { downloadCSV } from '@/lib/csv'
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh'
import { useRole, CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  initialClients: ClientWithOrg[]
}

export default function KanbanBoard({ initialClients }: Props) {
  useRealtimeRefresh(['space_clients', 'kyc_checks', 'payments'])
  const { canEdit } = useRole()
  const [clients, setClients] = useState<ClientWithOrg[]>(initialClients)
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk mode state
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagText, setFlagText] = useState('')
  const [targetStage, setTargetStage] = useState<Stage>('初步詢問')
  const [bulkBusy, setBulkBusy] = useState(false)

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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkMove = async () => {
    setBulkBusy(true)
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        fetch(`/api/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: targetStage }),
        })
      ))
      setClients(cs => cs.map(c => selectedIds.has(c.id) ? { ...c, stage: targetStage } : c))
      toast.success(`已移動 ${selectedIds.size} 位到「${targetStage}」`)
      setSelectedIds(new Set())
      setShowMoveModal(false)
    } catch { toast.error('批次移動失敗') } finally { setBulkBusy(false) }
  }

  const handleBulkFlag = async () => {
    if (!flagText.trim()) { toast.error('請填紅旗原因'); return }
    setBulkBusy(true)
    try {
      const tasks = Array.from(selectedIds).map(id => {
        const c = clients.find(x => x.id === id)
        if (!c) return Promise.resolve()
        const newFlags = Array.from(new Set([...(c.redFlags || []), flagText.trim()]))
        return fetch(`/api/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ redFlags: newFlags }),
        })
      })
      await Promise.all(tasks)
      setClients(cs => cs.map(c => selectedIds.has(c.id) ? { ...c, redFlags: Array.from(new Set([...(c.redFlags || []), flagText.trim()])) } : c))
      toast.success(`已加紅旗到 ${selectedIds.size} 位`)
      setSelectedIds(new Set())
      setShowFlagModal(false)
      setFlagText('')
    } catch { toast.error('批次加旗失敗') } finally { setBulkBusy(false) }
  }

  const handleBulkExport = () => {
    const selected = clients.filter(c => selectedIds.has(c.id))
    const headers = ['公司名稱', '聯絡人', '統編', '服務類型', '階段', '月費', '跟進日期', '紅旗']
    const rows = selected.map(c => [
      c.organization.name, c.organization.contactName, c.organization.taxId || '',
      c.serviceType, c.stage, String(c.monthlyFee),
      c.followUpDate || '', c.redFlags.join('、'),
    ])
    downloadCSV(`客戶批次匯出_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
    toast.success(`已匯出 ${selected.length} 位`)
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
        <CanEdit>
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()) }}
            className="btn-secondary text-xs"
          >
            {bulkMode ? '✓ 批次模式' : '批次操作'}
          </button>
        </CanEdit>
      </div>

      {bulkMode && selectedIds.size > 0 && (
        <div className="sticky top-0 z-10 -mx-1 px-4 py-2.5 flex items-center gap-3 rounded-lg mb-3" style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' }}>
          <span className="text-sm font-semibold" style={{ color: '#fbbf24' }}>已選 {selectedIds.size} 位</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setShowMoveModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1a1a1a', color: '#fbbf24' }}>移動階段</button>
            <button onClick={() => setShowFlagModal(true)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1a1a1a', color: '#fbbf24' }}>加紅旗</button>
            <button onClick={handleBulkExport} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1a1a1a', color: '#fbbf24' }}>匯出所選</button>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1a1a1a', color: '#888' }}>清除</button>
          </div>
        </div>
      )}

    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1">
        {STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            clients={grouped[stage]}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </DragDropContext>

    {showMoveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowMoveModal(false)}>
        <div className="rounded-xl p-6 w-80" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold text-white mb-4">批次移動至</h3>
          <select value={targetStage} onChange={e => setTargetStage(e.target.value as Stage)} className="input-base mb-4">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleBulkMove} disabled={bulkBusy} className="flex-1 btn-primary">確認</button>
            <button onClick={() => setShowMoveModal(false)} className="flex-1 btn-secondary">取消</button>
          </div>
        </div>
      </div>
    )}

    {showFlagModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowFlagModal(false)}>
        <div className="rounded-xl p-6 w-80" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
          <h3 className="font-semibold text-white mb-4">批次加紅旗</h3>
          <input value={flagText} onChange={e => setFlagText(e.target.value)} className="input-base mb-4" placeholder="如：業種可疑" autoFocus />
          <div className="flex gap-2">
            <button onClick={handleBulkFlag} disabled={bulkBusy} className="flex-1 btn-primary">確認</button>
            <button onClick={() => setShowFlagModal(false)} className="flex-1 btn-secondary">取消</button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
