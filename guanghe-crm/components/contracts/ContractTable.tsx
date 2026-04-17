'use client'

import { useState } from 'react'
import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import { formatDate, formatNTD } from '@/lib/utils'
import type { ContractWithClient } from '@/lib/queries'

type ContractStatus = '未開始' | '生效中' | '到期提醒' | '緊急到期' | '已過期'

function getContractStatus(startDate: string, endDate: string): ContractStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  if (end < today) return '已過期'
  const daysLeft = differenceInDays(end, today)
  if (daysLeft <= 7) return '緊急到期'
  if (daysLeft <= 60) return '到期提醒'
  if (start <= today) return '生效中'
  return '未開始'
}

function getDaysLeftLabel(endDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diff = differenceInDays(end, today)
  if (diff < 0) return `逾期 ${Math.abs(diff)} 天`
  if (diff === 0) return '今天到期'
  return `剩 ${diff} 天`
}

const STATUS_STYLES: Record<ContractStatus, { color: string; bg: string }> = {
  未開始:  { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  生效中:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  到期提醒: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  緊急到期: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  已過期:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const DEPOSIT_STYLES: Record<string, { color: string; bg: string }> = {
  已收: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  未收: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  已退: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

const SIGNING_STYLES: Record<string, { color: string; bg: string }> = {
  未發送: { color: '#555',    bg: 'rgba(85,85,85,0.12)' },
  待簽署: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  已簽署: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  已拒絕: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

const ALL_TABS: Array<'全部' | ContractStatus> = ['全部', '生效中', '到期提醒', '緊急到期', '已過期']

interface Props {
  contracts: ContractWithClient[]
}

export default function ContractTable({ contracts }: Props) {
  const [activeTab, setActiveTab] = useState<'全部' | ContractStatus>('全部')

  const contractsWithStatus = contracts.map((c) => ({
    ...c,
    status: getContractStatus(c.startDate, c.endDate),
  }))

  const counts: Record<ContractStatus, number> = {
    未開始: 0,
    生效中: 0,
    到期提醒: 0,
    緊急到期: 0,
    已過期: 0,
  }
  for (const c of contractsWithStatus) {
    counts[c.status]++
  }

  const filtered =
    activeTab === '全部'
      ? contractsWithStatus
      : contractsWithStatus.filter((c) => c.status === activeTab)

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(['生效中', '到期提醒', '緊急到期', '已過期'] as ContractStatus[]).map((s) => {
          const st = STATUS_STYLES[s]
          return (
            <div
              key={s}
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: '#111', border: '1px solid #222' }}
            >
              <span className="text-sm" style={{ color: '#b0aca6' }}>{s}</span>
              <span
                className="text-xl font-bold"
                style={{ color: st.color }}
              >
                {counts[s]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ALL_TABS.map((tab) => {
          const isActive = activeTab === tab
          const st = tab !== '全部' ? STATUS_STYLES[tab as ContractStatus] : null
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive
                  ? st
                    ? st.bg
                    : 'rgba(217,119,6,0.15)'
                  : '#1a1a1a',
                color: isActive
                  ? st
                    ? st.color
                    : '#d97706'
                  : '#706c66',
                border: `1px solid ${isActive ? (st ? st.color + '44' : '#d9770644') : '#252525'}`,
              }}
            >
              {tab}
              {tab !== '全部' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {counts[tab as ContractStatus]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #222', background: '#111' }}
      >
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center py-16 text-sm"
            style={{ color: '#706c66' }}
          >
            尚無合約記錄
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #222' }}>
                {['公司名稱', '合約類型', '繳費週期', '起始日', '到期日', '剩餘天數', '押金狀態', '狀態', '簽署狀態'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wide"
                    style={{ color: '#706c66' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const st = STATUS_STYLES[c.status]
                const ds = DEPOSIT_STYLES[c.depositStatus] ?? { color: '#706c66', bg: 'rgba(112,108,102,0.12)' }
                const daysLabel = getDaysLeftLabel(c.endDate)
                const isOverdue = daysLabel.startsWith('逾期')
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid #1a1a1a' : 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a1a1a')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${c.clientId}`}
                        className="font-medium hover:underline"
                        style={{ color: '#e8e6e3' }}
                      >
                        {c.orgName}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: '#b0aca6' }}>
                      {c.contractType}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#b0aca6' }}>
                      {c.paymentCycle}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#b0aca6' }}>
                      {formatDate(c.startDate)}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#b0aca6' }}>
                      {formatDate(c.endDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        style={{
                          color: isOverdue ? '#f87171' : c.status === '緊急到期' ? '#fb923c' : '#b0aca6',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {daysLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: ds.bg, color: ds.color }}
                      >
                        {c.depositStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: (SIGNING_STYLES[c.signingStatus ?? '未發送'] ?? SIGNING_STYLES['未發送']).bg,
                          color: (SIGNING_STYLES[c.signingStatus ?? '未發送'] ?? SIGNING_STYLES['未發送']).color,
                        }}
                      >
                        {c.signingStatus ?? '未發送'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
