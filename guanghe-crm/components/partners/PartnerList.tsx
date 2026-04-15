'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { CanEdit } from '@/components/providers/RoleProvider'
import EmptyState from '@/components/ui/EmptyState'
import { formatDate, formatNTD } from '@/lib/utils'

interface Partner {
  id: string
  name: string
  disability_type: string | null
  disability_level: string | null
  skill_level: string | null
  employment_type: string | null
  onboarded_at: string | null
  status: string
}

interface Props {
  initialPartners: Partner[]
  earningsByPartner: Record<string, { pending: number; accrued: number; paid: number }>
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  在職: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  培訓中: { bg: 'rgba(217,119,6,0.12)', color: '#fbbf24', border: 'rgba(217,119,6,0.3)' },
  離職: { bg: 'rgba(120,113,108,0.12)', color: '#a8a29e', border: 'rgba(120,113,108,0.3)' },
}

const DISABILITY_LEVELS = ['輕度', '中度', '重度', '極重度']
const SKILL_LEVELS = ['基礎', '中階', '進階']
const EMPLOYMENT_TYPES = ['按月計酬', '按件計酬']

export default function PartnerList({ initialPartners, earningsByPartner }: Props) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    disabilityType: '',
    disabilityLevel: '輕度',
    skillLevel: '基礎',
    employmentType: '按月計酬',
    onboardedAt: '',
  })

  const handleAdd = async () => {
    if (!form.name) {
      toast.error('請填寫姓名')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPartners([data, ...partners])
      toast.success('夥伴已新增')
      setShowModal(false)
      setForm({
        name: '',
        disabilityType: '',
        disabilityLevel: '輕度',
        skillLevel: '基礎',
        employmentType: '按月計酬',
        onboardedAt: '',
      })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#888' }}>
          共 {partners.length} 位夥伴
        </p>
        <CanEdit>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + 新增夥伴
          </button>
        </CanEdit>
      </div>

      {partners.length === 0 ? (
        <div
          className="rounded-xl p-8"
          style={{ background: '#111', border: '1px solid #1f1f1f' }}
        >
          <EmptyState
            illustration="documents"
            title="尚無夥伴資料"
            message="點擊「+ 新增夥伴」建立第一筆夥伴檔案"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => {
            const ern = earningsByPartner[p.id] || { pending: 0, accrued: 0, paid: 0 }
            const status = STATUS_STYLES[p.status] || STATUS_STYLES['培訓中']
            return (
              <Link
                key={p.id}
                href={`/partners/${p.id}`}
                className="block rounded-xl p-5"
                style={{
                  background: '#111',
                  border: '1px solid #1f1f1f',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1f1f1f')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{p.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: status.bg,
                          color: status.color,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#666' }}>
                      {p.disability_type || '—'}
                      {p.disability_level ? ` · ${p.disability_level}` : ''}
                      {p.skill_level ? ` · ${p.skill_level}` : ''}
                      {p.employment_type ? ` · ${p.employment_type}` : ''}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: '#666' }}>
                    到職 {formatDate(p.onboarded_at)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3" style={{ borderTop: '1px solid #1a1a1a' }}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
                      待結算
                    </p>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: '#fbbf24' }}>
                      {formatNTD(ern.pending)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
                      已累積
                    </p>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: '#38bdf8' }}>
                      {formatNTD(ern.accrued)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
                      已支付
                    </p>
                    <p className="text-sm font-semibold tabular-nums" style={{ color: '#34d399' }}>
                      {formatNTD(ern.paid)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div
            className="rounded-xl p-6 w-[28rem]"
            style={{ background: '#111', border: '1px solid #1f1f1f' }}
          >
            <h3 className="font-semibold text-white mb-4">新增夥伴</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                  姓名 *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input-base"
                  placeholder="王小明"
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                  障礙類別
                </label>
                <input
                  value={form.disabilityType}
                  onChange={(e) => setForm((f) => ({ ...f, disabilityType: e.target.value }))}
                  className="input-base"
                  placeholder="視障、聽障..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                    障礙等級
                  </label>
                  <select
                    value={form.disabilityLevel}
                    onChange={(e) => setForm((f) => ({ ...f, disabilityLevel: e.target.value }))}
                    className="input-base"
                  >
                    {DISABILITY_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                    技能等級
                  </label>
                  <select
                    value={form.skillLevel}
                    onChange={(e) => setForm((f) => ({ ...f, skillLevel: e.target.value }))}
                    className="input-base"
                  >
                    {SKILL_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                    僱用型態
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))}
                    className="input-base"
                  >
                    {EMPLOYMENT_TYPES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>
                    到職日
                  </label>
                  <input
                    type="date"
                    value={form.onboardedAt}
                    onChange={(e) => setForm((f) => ({ ...f, onboardedAt: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">
                {adding ? '新增中...' : '確認新增'}
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
