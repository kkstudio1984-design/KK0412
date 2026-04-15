'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit } from '@/components/providers/RoleProvider'
import { formatNTD, formatDate } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'

interface Recon {
  id: string
  reconciliation_date: string
  opening_balance: number
  cash_in: number
  cash_out: number
  expected_balance: number
  actual_balance: number
  variance: number
  status: string
  notes: string | null
  reconciler?: { name: string } | null
}

interface Transaction {
  id: string
  transaction_date: string
  direction: string
  amount: number
  category: string
  description: string | null
}

interface Props {
  todayStr: string
  latestRecon: Recon | null
  todayTx: Transaction[]
  recentRecons: Recon[]
}

const CATEGORY_STYLES: Record<string, string> = {
  '客戶繳款': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  '零用金': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  '退款': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  '補充金': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  '其他': 'text-stone-400 bg-stone-500/10 border-stone-500/20',
}

export default function CashReconciliation({ todayStr, latestRecon, todayTx: initialTx, recentRecons }: Props) {
  const [todayTx, setTodayTx] = useState(initialTx)
  const [showTxModal, setShowTxModal] = useState(false)
  const [showReconModal, setShowReconModal] = useState(false)
  const [busy, setBusy] = useState(false)

  const [txForm, setTxForm] = useState({
    direction: '收入',
    amount: '',
    category: '客戶繳款',
    description: '',
  })

  const openingBalance = latestRecon?.actual_balance || 0
  const cashIn = todayTx.filter(t => t.direction === '收入').reduce((s, t) => s + t.amount, 0)
  const cashOut = todayTx.filter(t => t.direction === '支出').reduce((s, t) => s + t.amount, 0)
  const expectedBalance = openingBalance + cashIn - cashOut

  const [reconForm, setReconForm] = useState({
    actualBalance: String(expectedBalance),
    notes: '',
  })

  const alreadyReconciled = recentRecons.some(r => r.reconciliation_date === todayStr)

  const handleAddTx = async () => {
    if (!txForm.amount || parseInt(txForm.amount) <= 0) { toast.error('請填有效金額'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/finance/cash/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txForm, transactionDate: todayStr }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTodayTx([data, ...todayTx])
      toast.success('已記錄')
      setShowTxModal(false)
      setTxForm({ direction: '收入', amount: '', category: '客戶繳款', description: '' })
    } catch { toast.error('失敗') } finally { setBusy(false) }
  }

  const handleReconcile = async () => {
    if (!reconForm.actualBalance) { toast.error('請填實際餘額'); return }
    const actual = parseInt(reconForm.actualBalance)
    setBusy(true)
    try {
      const res = await fetch('/api/finance/cash/reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reconciliationDate: todayStr,
          openingBalance,
          cashIn,
          cashOut,
          expectedBalance,
          actualBalance: actual,
          notes: reconForm.notes,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success('盤點完成')
      setShowReconModal(false)
      // reload to show new reconciliation
      window.location.reload()
    } catch { toast.error('失敗') } finally { setBusy(false) }
  }

  const variance = parseInt(reconForm.actualBalance || '0') - expectedBalance

  return (
    <div className="space-y-6">
      {/* Today Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title">今日現金 · {formatDate(todayStr)}</h2>
          {alreadyReconciled && (
            <span className="badge badge-green">✓ 已盤點</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <p className="section-title mb-1.5">開帳餘額</p>
            <p className="text-xl font-bold text-white tabular-nums">{formatNTD(openingBalance)}</p>
          </div>
          <div className="card p-4">
            <p className="section-title mb-1.5">今日收入</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#34d399' }}>+ {formatNTD(cashIn)}</p>
          </div>
          <div className="card p-4">
            <p className="section-title mb-1.5">今日支出</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#f87171' }}>- {formatNTD(cashOut)}</p>
          </div>
          <div className="card p-4" style={{ borderColor: '#f59e0b33' }}>
            <p className="section-title mb-1.5">預期餘額</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: '#fbbf24' }}>{formatNTD(expectedBalance)}</p>
          </div>
        </div>

        <CanEdit>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowTxModal(true)} className="btn-primary">+ 記錄收支</button>
            <button onClick={() => setShowReconModal(true)} disabled={alreadyReconciled} className="btn-secondary">
              {alreadyReconciled ? '今日已盤點' : '盤點結帳'}
            </button>
          </div>
        </CanEdit>
      </div>

      {/* Today transactions */}
      <div className="card p-5">
        <h2 className="section-title mb-3">今日異動（{todayTx.length} 筆）</h2>
        {todayTx.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#666' }}>今日尚無現金異動</p>
        ) : (
          <div className="space-y-2">
            {todayTx.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: '#1f1f1f' }}>
                <span className={`badge ${CATEGORY_STYLES[t.category]}`}>{t.category}</span>
                <span className="text-sm flex-1 truncate" style={{ color: '#c8c4be' }}>{t.description || '—'}</span>
                <span className={`font-semibold tabular-nums shrink-0`} style={{ color: t.direction === '收入' ? '#34d399' : '#f87171' }}>
                  {t.direction === '收入' ? '+' : '-'} {formatNTD(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent reconciliations */}
      <div>
        <h2 className="section-title mb-3">近期盤點紀錄</h2>
        {recentRecons.length === 0 ? (
          <EmptyState illustration="empty" title="尚無盤點紀錄" message="完成今日現金盤點後會出現在此" />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold px-4 py-3">日期</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">開帳</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">收入</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">支出</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">預期</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">實際</th>
                  <th className="text-right text-xs font-semibold px-4 py-3">差異</th>
                  <th className="text-left text-xs font-semibold px-4 py-3">盤點人</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentRecons.map(r => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-white">{formatDate(r.reconciliation_date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNTD(r.opening_balance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#34d399' }}>+{formatNTD(r.cash_in)}</td>
                    <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#f87171' }}>-{formatNTD(r.cash_out)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNTD(r.expected_balance)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{formatNTD(r.actual_balance)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums" style={{ color: r.variance === 0 ? '#34d399' : Math.abs(r.variance) < 100 ? '#fbbf24' : '#f87171' }}>
                      {r.variance > 0 ? '+' : ''}{formatNTD(r.variance)}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9a9a9a' }}>{r.reconciler?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowTxModal(false)}>
          <div className="rounded-xl p-6 w-96" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">記錄現金異動</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>類型</label>
                <div className="flex gap-2">
                  {['收入', '支出'].map(d => (
                    <button
                      key={d}
                      onClick={() => setTxForm(f => ({ ...f, direction: d }))}
                      className="flex-1 py-2 rounded-lg text-sm font-medium"
                      style={{
                        background: txForm.direction === d ? (d === '收入' ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)') : '#1a1a1a',
                        color: txForm.direction === d ? (d === '收入' ? '#34d399' : '#f87171') : '#888',
                        border: `1px solid ${txForm.direction === d ? (d === '收入' ? '#34d39950' : '#f8717150') : '#2a2a2a'}`,
                      }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>類別</label>
                <select value={txForm.category} onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))} className="input-base">
                  <option value="客戶繳款">客戶繳款</option>
                  <option value="零用金">零用金</option>
                  <option value="退款">退款</option>
                  <option value="補充金">補充金</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>金額</label>
                <input type="number" min="1" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} className="input-base" placeholder="2500" autoFocus />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>說明</label>
                <input value={txForm.description} onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} className="input-base" placeholder="客戶繳月租" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddTx} disabled={busy} className="flex-1 btn-primary">確認記錄</button>
              <button onClick={() => setShowTxModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Reconciliation modal */}
      {showReconModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowReconModal(false)}>
          <div className="rounded-xl p-6 w-96" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white mb-4">今日盤點結帳</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-3 rounded-lg" style={{ background: '#0a0a0a' }}>
                  <p className="text-xs" style={{ color: '#888' }}>預期餘額</p>
                  <p className="font-bold mt-1 tabular-nums" style={{ color: '#fbbf24' }}>{formatNTD(expectedBalance)}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: '#0a0a0a' }}>
                  <p className="text-xs" style={{ color: '#888' }}>差異</p>
                  <p className="font-bold mt-1 tabular-nums" style={{ color: variance === 0 ? '#34d399' : Math.abs(variance) < 100 ? '#fbbf24' : '#f87171' }}>
                    {variance > 0 ? '+' : ''}{formatNTD(variance)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>實際清點餘額</label>
                <input type="number" min="0" value={reconForm.actualBalance} onChange={e => setReconForm(f => ({ ...f, actualBalance: e.target.value }))} className="input-base" autoFocus />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>備註（差異原因等）</label>
                <textarea rows={2} value={reconForm.notes} onChange={e => setReconForm(f => ({ ...f, notes: e.target.value }))} className="input-base" style={{ resize: 'none' }} />
              </div>
              {Math.abs(variance) >= 100 && (
                <p className="text-xs p-2 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                  ⚠ 差異超過 NT$100，將標記為異常
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleReconcile} disabled={busy} className="flex-1 btn-primary">確認盤點</button>
              <button onClick={() => setShowReconModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
