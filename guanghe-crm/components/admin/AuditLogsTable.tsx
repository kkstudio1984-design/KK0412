'use client'

import { useState, useMemo } from 'react'

interface AuditLog {
  id: string
  user_id: string | null
  table_name: string
  record_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  user?: { name: string; email: string } | null
}

interface Props {
  logs: AuditLog[]
}

const TABLE_LABELS: Record<string, string> = {
  contracts: '合約',
  payments: '收款',
  kyc_checks: 'KYC',
  organizations: '組織',
  space_clients: '空間客戶',
}

const FIELD_LABELS: Record<string, string> = {
  monthly_rent: '月租金',
  payment_cycle: '繳款週期',
  deposit_amount: '押金金額',
  deposit_status: '押金狀態',
  status: '狀態',
  amount: '金額',
  override_reason: '覆核原因',
  tax_id: '統編',
  contact_name: '聯絡人',
  name: '名稱',
  representative_address: '負責人地址',
  stage: '階段',
  is_high_risk_kyc: '高風險KYC',
  blacklist_flag: '黑名單',
}

export default function AuditLogsTable({ logs }: Props) {
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState<string>('all')

  const tables = useMemo(() => Array.from(new Set(logs.map(l => l.table_name))), [logs])
  const users = useMemo(() => {
    const map = new Map<string, string>()
    logs.forEach(l => {
      if (l.user_id && l.user) map.set(l.user_id, l.user.name || l.user.email)
    })
    return Array.from(map.entries())
  }, [logs])

  const filtered = logs.filter(l => {
    if (tableFilter !== 'all' && l.table_name !== tableFilter) return false
    if (userFilter !== 'all' && l.user_id !== userFilter) return false
    return true
  })

  const timeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return '剛剛'
    if (mins < 60) return `${mins} 分鐘前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} 小時前`
    return `${Math.floor(hours / 24)} 天前`
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={tableFilter} onChange={e => setTableFilter(e.target.value)} className="input-base max-w-xs">
          <option value="all">所有資料表</option>
          {tables.map(t => <option key={t} value={t}>{TABLE_LABELS[t] || t}</option>)}
        </select>
        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="input-base max-w-xs">
          <option value="all">所有使用者</option>
          {users.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <span className="text-xs text-stone-500">共 {filtered.length} 筆</span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: '#555' }}>無記錄</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold px-4 py-3">時間</th>
                <th className="text-left text-xs font-semibold px-4 py-3">使用者</th>
                <th className="text-left text-xs font-semibold px-4 py-3">資料表</th>
                <th className="text-left text-xs font-semibold px-4 py-3">欄位</th>
                <th className="text-left text-xs font-semibold px-4 py-3">變更</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-xs">
                    <div>{timeAgo(log.changed_at)}</div>
                    <div className="text-stone-500">{new Date(log.changed_at).toLocaleString('zh-TW')}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.user?.name || log.user?.email || '系統'}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-stone">{TABLE_LABELS[log.table_name] || log.table_name}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">{FIELD_LABELS[log.field_name] || log.field_name}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="text-red-400 line-through">{log.old_value || '空'}</span>
                    <span className="text-stone-500 mx-2">→</span>
                    <span className="text-emerald-400">{log.new_value || '空'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
