'use client'

import { useState } from 'react'
import Link from 'next/link'
import EmptyState from '@/components/ui/EmptyState'

interface Client {
  id: string
  orgName: string
  taxId: string
  contactName: string
  stage: string
  isHighRisk: boolean
  isBlacklist: boolean
  redFlags: string[]
  kycPassed: number
  kycTotal: number
}

interface Props {
  clients: Client[]
}

export default function AddressRiskTable({ clients }: Props) {
  const [search, setSearch] = useState('')

  const filtered = search
    ? clients.filter(c =>
        c.orgName.toLowerCase().includes(search.toLowerCase()) ||
        c.taxId.includes(search) ||
        c.contactName.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋公司名稱、統編、負責人..."
          className="w-full md:w-80 input-base"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide">公司名稱</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide hidden md:table-cell">統一編號</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide hidden md:table-cell">負責人</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide">狀態</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide">KYC</th>
              <th className="text-left text-xs font-semibold text-stone-400 px-4 py-3 tracking-wide">風險</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {filtered.map((c) => (
              <tr key={c.id} className={`hover:bg-stone-50 ${c.isHighRisk || c.isBlacklist ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="font-medium text-stone-800 hover:text-amber-600">{c.orgName}</Link>
                </td>
                <td className="px-4 py-3 text-stone-600 font-mono text-xs hidden md:table-cell">{c.taxId}</td>
                <td className="px-4 py-3 text-stone-600 hidden md:table-cell">{c.contactName}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{c.stage}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${c.kycPassed === c.kycTotal && c.kycTotal > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {c.kycPassed}/{c.kycTotal}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {c.isHighRisk && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">高風險</span>}
                    {c.isBlacklist && <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">黑名單</span>}
                    {c.redFlags.length > 0 && <span className="text-xs">🚩{c.redFlags.length}</span>}
                    {!c.isHighRisk && !c.isBlacklist && c.redFlags.length === 0 && <span className="text-xs text-stone-300">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState illustration="search" message="無符合條件的結果" />}
      </div>
    </div>
  )
}
