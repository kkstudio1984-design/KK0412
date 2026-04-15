'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Seat {
  id: string
  seat_number: string
  zone: string | null
  seat_type: string
  capacity: number
  notes: string | null
  is_active: boolean
}

interface Occupancy {
  id: string
  seat_id: string
  space_client_id: string | null
  occupant_name: string
  occupant_type: string
  check_in_time: string
  space_client?: { organization: { name: string } | null } | null
}

interface Client {
  id: string
  serviceType: string
  name: string
}

interface Props {
  seats: Seat[]
  occupancy: Occupancy[]
  clients: Client[]
}

const ZONE_COLORS: Record<string, string> = {
  '開放區': '#d97706',
  '安靜區': '#0ea5e9',
  '會議室': '#8b5cf6',
  '吧台': '#ec4899',
  '其他': '#888',
}

export default function SeatGrid({ seats: initialSeats, occupancy: initialOcc, clients }: Props) {
  const [seats, setSeats] = useState(initialSeats)
  const [occupancy, setOccupancy] = useState(initialOcc)
  const [assignSeat, setAssignSeat] = useState<Seat | null>(null)
  const [addingSeat, setAddingSeat] = useState(false)
  const [newSeat, setNewSeat] = useState({ seatNumber: '', zone: '開放區', seatType: '共享', capacity: 1 })
  const [showAddSeat, setShowAddSeat] = useState(false)
  const [form, setForm] = useState({ occupantType: '客戶', spaceClientId: '', occupantName: '' })
  const [busy, setBusy] = useState(false)

  const byZone: Record<string, Seat[]> = {}
  for (const s of seats) {
    const z = s.zone || '其他'
    if (!byZone[z]) byZone[z] = []
    byZone[z].push(s)
  }

  const occBySeatId: Record<string, Occupancy> = {}
  for (const o of occupancy) occBySeatId[o.seat_id] = o

  const totalSeats = seats.length
  const occupiedCount = occupancy.length
  const availableCount = totalSeats - occupiedCount
  const utilization = totalSeats > 0 ? Math.round((occupiedCount / totalSeats) * 100) : 0

  const handleAssign = async () => {
    if (!assignSeat) return
    if (!form.occupantName.trim() && !form.spaceClientId) { toast.error('請選擇客戶或輸入姓名'); return }
    setBusy(true)
    try {
      const clientName = clients.find(c => c.id === form.spaceClientId)?.name
      const res = await fetch('/api/seats/occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: assignSeat.id,
          spaceClientId: form.spaceClientId || null,
          occupantName: form.occupantName.trim() || clientName || '—',
          occupantType: form.occupantType,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setOccupancy([...occupancy, data])
      setAssignSeat(null)
      setForm({ occupantType: '客戶', spaceClientId: '', occupantName: '' })
      toast.success(`${assignSeat.seat_number} 已分配`)
    } catch { toast.error('失敗') } finally { setBusy(false) }
  }

  const handleRelease = async (occId: string, seatNum: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/seats/occupancy/${occId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkOut: true }),
      })
      if (!res.ok) throw new Error()
      setOccupancy(occupancy.filter(o => o.id !== occId))
      toast.success(`${seatNum} 已釋放`)
    } catch { toast.error('失敗') } finally { setBusy(false) }
  }

  const handleAddSeat = async () => {
    if (!newSeat.seatNumber.trim()) { toast.error('請輸入座位編號'); return }
    setAddingSeat(true)
    try {
      const res = await fetch('/api/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeat),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSeats([...seats, data])
      toast.success(`座位 ${data.seat_number} 已新增`)
      setShowAddSeat(false)
      setNewSeat({ seatNumber: '', zone: '開放區', seatType: '共享', capacity: 1 })
    } catch { toast.error('新增失敗') } finally { setAddingSeat(false) }
  }

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="section-title mb-2">總座位</p>
          <p className="text-3xl font-bold text-white tabular-nums">{totalSeats}</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">使用中</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: '#fbbf24' }}>{occupiedCount}</p>
        </div>
        <div className="card p-5">
          <p className="section-title mb-2">使用率</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: utilization > 80 ? '#f87171' : utilization > 50 ? '#fbbf24' : '#34d399' }}>{utilization}%</p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>剩 {availableCount} 位</p>
        </div>
      </div>

      <div className="flex items-center justify-end mb-4">
        <CanEdit>
          <button onClick={() => setShowAddSeat(true)} className="btn-secondary text-xs">+ 新增座位</button>
        </CanEdit>
      </div>

      {/* Grid by zone */}
      {seats.length === 0 ? (
        <EmptyState illustration="empty" title="尚未設定座位" message="點「+ 新增座位」開始配置空間" />
      ) : (
        <div className="space-y-6">
          {Object.entries(byZone).map(([zone, zoneSeats]) => (
            <div key={zone}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full" style={{ background: ZONE_COLORS[zone] }} />
                <p className="text-sm font-semibold" style={{ color: ZONE_COLORS[zone] }}>{zone}</p>
                <p className="text-xs" style={{ color: '#888' }}>（{zoneSeats.filter(s => occBySeatId[s.id]).length} / {zoneSeats.length}）</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {zoneSeats.map(seat => {
                  const occ = occBySeatId[seat.id]
                  const isOccupied = !!occ
                  return (
                    <button
                      key={seat.id}
                      onClick={() => isOccupied ? null : setAssignSeat(seat)}
                      className="rounded-lg p-3 text-left"
                      style={{
                        background: isOccupied ? 'rgba(251,191,36,0.1)' : '#111',
                        border: '1px solid ' + (isOccupied ? 'rgba(251,191,36,0.3)' : '#222'),
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white">{seat.seat_number}</span>
                        <span className="text-xs" style={{ color: '#666' }}>{seat.seat_type}</span>
                      </div>
                      {isOccupied ? (
                        <>
                          <p className="text-xs font-medium truncate" style={{ color: '#fbbf24' }}>● {occ.occupant_name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#888' }}>{occ.space_client?.organization?.name || occ.occupant_type}</p>
                          <CanEdit>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRelease(occ.id, seat.seat_number) }}
                              disabled={busy}
                              className="mt-2 w-full text-xs py-1 rounded"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                            >
                              釋放
                            </button>
                          </CanEdit>
                        </>
                      ) : (
                        <p className="text-xs mt-2" style={{ color: '#555' }}>空位 · 點擊分配</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign modal */}
      {assignSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setAssignSeat(null)}>
          <div className="rounded-xl p-6 w-96" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">分配座位 {assignSeat.seat_number}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>使用者類型</label>
                <select value={form.occupantType} onChange={e => setForm(f => ({ ...f, occupantType: e.target.value }))} className="input-base">
                  <option value="客戶">服務中客戶</option>
                  <option value="訪客">訪客</option>
                  <option value="夥伴">夥伴</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              {form.occupantType === '客戶' && (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>客戶</label>
                  <select value={form.spaceClientId} onChange={e => setForm(f => ({ ...f, spaceClientId: e.target.value }))} className="input-base">
                    <option value="">—</option>
                    {clients.filter(c => c.serviceType !== '場地租借').map(c => (
                      <option key={c.id} value={c.id}>{c.name}（{c.serviceType}）</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>使用者姓名 {form.spaceClientId ? '(選填覆蓋)' : ''}</label>
                <input value={form.occupantName} onChange={e => setForm(f => ({ ...f, occupantName: e.target.value }))} className="input-base" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAssign} disabled={busy} className="flex-1 btn-primary">確認分配</button>
              <button onClick={() => setAssignSeat(null)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Add seat modal */}
      {showAddSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowAddSeat(false)}>
          <div className="rounded-xl p-6 w-96" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">新增座位</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>座位編號</label>
                <input value={newSeat.seatNumber} onChange={e => setNewSeat({ ...newSeat, seatNumber: e.target.value })} className="input-base" placeholder="如：A-01" autoFocus />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>區域</label>
                <select value={newSeat.zone} onChange={e => setNewSeat({ ...newSeat, zone: e.target.value })} className="input-base">
                  <option value="開放區">開放區</option>
                  <option value="安靜區">安靜區</option>
                  <option value="會議室">會議室</option>
                  <option value="吧台">吧台</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>類型</label>
                <select value={newSeat.seatType} onChange={e => setNewSeat({ ...newSeat, seatType: e.target.value })} className="input-base">
                  <option value="共享">共享工位</option>
                  <option value="固定">固定工位</option>
                  <option value="會議室">會議室</option>
                  <option value="訪客">訪客</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>容量（人數）</label>
                <input type="number" min="1" value={newSeat.capacity} onChange={e => setNewSeat({ ...newSeat, capacity: parseInt(e.target.value) || 1 })} className="input-base" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddSeat} disabled={addingSeat} className="flex-1 btn-primary">{addingSeat ? '新增中...' : '確認新增'}</button>
              <button onClick={() => setShowAddSeat(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
