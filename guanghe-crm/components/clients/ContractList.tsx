'use client'

import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { differenceInMonths, differenceInDays, format } from 'date-fns'
import { Contract, PaymentCycle } from '@/lib/types'
import { formatDate, formatNTD } from '@/lib/utils'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'

interface Props {
  clientId: string
  serviceType: string
  monthlyFee: number
  initialContracts: Contract[]
  onContractCreated?: () => void
}

// ── 費率設定（可抽到 DB 設定檔，現在先放前端）──────────────
const CYCLE_MONTHS: Record<PaymentCycle, number> = {
  '月繳': 1,
  '季繳': 3,
  '半年繳': 6,
  '年繳': 12,
}

// 年繳 95折、半年繳 97折、季繳 98折、月繳 無折扣
const CYCLE_DISCOUNT: Record<PaymentCycle, number> = {
  '月繳':  1.00,
  '季繳':  0.98,
  '半年繳': 0.97,
  '年繳':  0.95,
}

const CYCLE_LABEL: Record<PaymentCycle, string> = {
  '月繳': '月繳',
  '季繳': '季繳（98折）',
  '半年繳': '半年繳（97折）',
  '年繳': '年繳（95折）建議',
}

// ── 押金狀態樣式 ───────────────────────────────────────────
const DEPOSIT_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  '未收': { color: '#888',    bg: 'rgba(255,255,255,0.04)', border: '#333' },
  '已收': { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.3)' },
  '已退': { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',   border: 'rgba(56,189,248,0.3)' },
}

// ── 合約狀態（顯示在卡片右上角）─────────────────────────────
function getContractBadge(endDate: string): { label: string; color: string; bg: string } {
  const today = new Date()
  const end   = new Date(endDate)
  const days  = differenceInDays(end, today)
  if (days < 0)  return { label: '已過期',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' }
  if (days <= 7) return { label: '緊急到期', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' }
  if (days <= 60) return { label: '到期提醒', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' }
  return { label: '生效中', color: '#34d399', bg: 'rgba(52,211,153,0.1)' }
}

// ── 費用試算 ──────────────────────────────────────────────
function calcPreview(monthlyRent: string, paymentCycle: PaymentCycle, startDate: string, endDate: string) {
  const monthly = parseInt(monthlyRent) || 0
  if (!monthly || !startDate || !endDate) return null

  const start  = new Date(startDate)
  const end    = new Date(endDate)
  if (end <= start) return null

  const cycleMonths = CYCLE_MONTHS[paymentCycle]
  const discount    = CYCLE_DISCOUNT[paymentCycle]
  const perCycle    = Math.round(monthly * cycleMonths * discount)
  const totalMonths = differenceInMonths(end, start)
  const payments    = Math.floor(totalMonths / cycleMonths)
  const totalAmount = perCycle * payments
  const savedAmount = Math.round(monthly * cycleMonths * payments) - totalAmount

  return { perCycle, payments, totalAmount, savedAmount, cycleMonths, discount }
}

export default function ContractList({ clientId, serviceType, monthlyFee, initialContracts, onContractCreated }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding]       = useState(false)

  const [form, setForm] = useState({
    paymentCycle:  '年繳' as PaymentCycle,
    startDate:     format(new Date(), 'yyyy-MM-dd'),
    endDate:       format(new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()), 'yyyy-MM-dd'),
    monthlyRent:   String(monthlyFee),
    depositAmount: String(monthlyFee * 2),
  })

  const set = (field: string, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  // 費用預覽（即時計算）
  const preview = useMemo(
    () => calcPreview(form.monthlyRent, form.paymentCycle, form.startDate, form.endDate),
    [form.monthlyRent, form.paymentCycle, form.startDate, form.endDate]
  )

  const handleAdd = async () => {
    if (!form.startDate || !form.endDate || !form.monthlyRent) {
      toast.error('請填寫必要欄位')
      return
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error('到期日必須晚於起始日')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractType:  serviceType,
          paymentCycle:  form.paymentCycle,
          startDate:     form.startDate,
          endDate:       form.endDate,
          monthlyRent:   form.monthlyRent,
          depositAmount: form.depositAmount,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '新增合約失敗')
      }
      const data = await res.json()
      setContracts(cs => [data.contract, ...cs].map((ct: any) => ({
        id:            ct.id,
        spaceClientId: ct.space_client_id  || ct.spaceClientId,
        contractType:  ct.contract_type    || ct.contractType,
        paymentCycle:  ct.payment_cycle    || ct.paymentCycle,
        startDate:     ct.start_date       || ct.startDate,
        endDate:       ct.end_date         || ct.endDate,
        monthlyRent:   ct.monthly_rent     ?? ct.monthlyRent,
        depositAmount: ct.deposit_amount   ?? ct.depositAmount,
        depositStatus: ct.deposit_status   || ct.depositStatus,
        isNotarized:   ct.is_notarized     ?? ct.isNotarized,
        notarizedAt:   ct.notarized_at     || ct.notarizedAt,
      })))
      toast.success(`合約已建立，自動產生 ${data.paymentsCreated} 筆繳款記錄`)
      setShowModal(false)
      onContractCreated?.()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '新增合約失敗')
    } finally {
      setAdding(false)
    }
  }

  // ── 輸入欄共用樣式 ────────────────────────────────────────
  const inputStyle = {
    background: '#0a0a0a',
    border: '1px solid #2a2a2a',
    color: '#e8e6e3',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    width: '100%',
    outline: 'none',
  } as const

  return (
    <div className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #222' }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold" style={{ color: '#e8e6e3' }}>合約管理</h2>
        <CanEdit>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)', color: '#0a0a0a' }}
          >
            + 新增合約
          </button>
        </CanEdit>
      </div>

      {contracts.length === 0 ? (
        <EmptyState illustration="contracts" title="尚無合約" message="建立合約後將自動產生繳款記錄" />
      ) : (
        <div className="space-y-3">
          {contracts.map((ct) => {
            const badge   = getContractBadge(ct.endDate)
            const deposit = DEPOSIT_STYLE[ct.depositStatus] || DEPOSIT_STYLE['未收']
            const daysLeft = differenceInDays(new Date(ct.endDate), new Date())
            return (
              <div key={ct.id} className="rounded-lg p-4" style={{ border: '1px solid #2a2a2a', background: '#0f0f0f' }}>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: '#e8e6e3' }}>{ct.contractType}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(217,119,6,0.1)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.25)' }}>
                      {ct.paymentCycle}
                    </span>
                    <a
                      href={`/print/contract/${ct.id}`}
                      target="_blank" rel="noopener"
                      className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid #2a2a2a' }}
                    >
                      🖨 PDF
                    </a>
                  </div>
                  {/* Status badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}>
                    {badge.label}
                    {daysLeft >= 0 && daysLeft <= 60 && ` · ${daysLeft}天`}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-xs" style={{ color: '#888' }}>
                  <div>期間：<span style={{ color: '#b0aca6' }}>{formatDate(ct.startDate)} ~ {formatDate(ct.endDate)}</span></div>
                  <div>月租：<span style={{ color: '#e8e6e3', fontWeight: 500 }}>{formatNTD(ct.monthlyRent)}</span></div>
                  <div className="flex items-center gap-1.5">
                    押金：<span style={{ color: '#b0aca6' }}>{formatNTD(ct.depositAmount)}</span>
                    <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ background: deposit.bg, color: deposit.color, border: `1px solid ${deposit.border}` }}>
                      {ct.depositStatus}
                    </span>
                  </div>
                  {ct.isNotarized && (
                    <div style={{ color: '#38bdf8' }}>✓ 已公證</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 新增合約 Modal ──────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl shadow-2xl p-6 w-[440px] max-h-[92vh] overflow-y-auto"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
            <h3 className="font-semibold mb-5" style={{ color: '#e8e6e3' }}>新增合約</h3>

            <div className="space-y-4">
              {/* 合約類型（唯讀） */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>合約類型</label>
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#888' }}>
                  {serviceType}
                </p>
              </div>

              {/* 繳款週期 */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>繳款週期</label>
                <select value={form.paymentCycle} onChange={e => set('paymentCycle', e.target.value)}
                  style={inputStyle}>
                  {(Object.keys(CYCLE_LABEL) as PaymentCycle[]).map(c => (
                    <option key={c} value={c}>{CYCLE_LABEL[c]}</option>
                  ))}
                </select>
              </div>

              {/* 起/到期日 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>起始日</label>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                    style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>到期日</label>
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                    style={inputStyle} />
                </div>
              </div>

              {/* 月租金 */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>月租金（NT$）</label>
                <input type="number" min="0" value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)}
                  style={inputStyle} />
              </div>

              {/* 押金 */}
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: '#666' }}>
                  押金（NT$）
                  <span className="ml-1" style={{ color: '#555' }}>— 建議兩個月月租</span>
                </label>
                <input type="number" min="0" value={form.depositAmount} onChange={e => set('depositAmount', e.target.value)}
                  style={inputStyle} />
              </div>

              {/* ── 費用試算預覽 ── */}
              {preview ? (
                <div className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)' }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#fbbf24' }}>💰 費用試算</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div style={{ color: '#888' }}>每期繳款</div>
                    <div style={{ color: '#e8e6e3', fontWeight: 600 }}>
                      {formatNTD(preview.perCycle)}
                      {preview.discount < 1 && (
                        <span className="ml-1" style={{ color: '#34d399', fontSize: '0.65rem' }}>
                          ({Math.round((1 - preview.discount) * 100)}折優惠)
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#888' }}>預計期數</div>
                    <div style={{ color: '#e8e6e3' }}>{preview.payments} 期（每 {preview.cycleMonths} 個月）</div>
                    <div style={{ color: '#888' }}>合約總額</div>
                    <div style={{ color: '#e8e6e3', fontWeight: 600 }}>{formatNTD(preview.totalAmount)}</div>
                    {preview.savedAmount > 0 && (
                      <>
                        <div style={{ color: '#888' }}>節省金額</div>
                        <div style={{ color: '#34d399', fontWeight: 500 }}>省 {formatNTD(preview.savedAmount)}</div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.15)', color: '#888' }}>
                  填寫月租金與日期後自動試算費用
                </div>
              )}

              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', color: '#a16207' }}>
                建立後將依繳款週期自動產生繳款記錄
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{
                  background: adding ? '#555' : 'linear-gradient(to right, #f59e0b, #d97706)',
                  color: '#0a0a0a',
                  opacity: adding ? 0.7 : 1,
                  cursor: adding ? 'not-allowed' : 'pointer',
                }}>
                {adding ? '建立中...' : '確認建立'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 text-sm py-2 rounded-lg"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888' }}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
