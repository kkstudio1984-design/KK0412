'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CanEdit, useRole } from '@/components/providers/RoleProvider'
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

interface AttendanceRecord {
  id: string
  attendance_date: string
  check_in_time: string | null
  check_out_time: string | null
  hours_worked: number | null
  activity: string | null
  notes: string | null
  subsidy_id: string | null
  subsidy?: { subsidy_name: string } | null
}

interface Earning {
  id: string
  amount: number
  status: string
  description: string | null
  period_month: string | null
  paid_at: string | null
  approved_at: string | null
  created_at: string
  task_id: string | null
  task?: { title: string; project?: { name: string } | null } | null
}

interface SubsidyOpt {
  id: string
  subsidy_name: string
}

interface Props {
  partner: Partner
  attendance: AttendanceRecord[]
  earnings: Earning[]
  subsidies: SubsidyOpt[]
}

const EARNING_STATUSES = ['待結算', '已累積', '已支付']

const EARNING_STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  待結算: { bg: 'rgba(217,119,6,0.12)', color: '#fbbf24', border: 'rgba(217,119,6,0.3)' },
  已累積: { bg: 'rgba(14,165,233,0.12)', color: '#38bdf8', border: 'rgba(14,165,233,0.3)' },
  已支付: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
}

export default function PartnerDetail({ partner, attendance: initialAttendance, earnings: initialEarnings, subsidies }: Props) {
  const { isAdmin } = useRole()
  const [attendance, setAttendance] = useState(initialAttendance)
  const [earnings, setEarnings] = useState(initialEarnings)

  // Attendance modal
  const [showAttModal, setShowAttModal] = useState(false)
  const [attForm, setAttForm] = useState({
    attendanceDate: new Date().toISOString().slice(0, 10),
    checkInTime: '',
    checkOutTime: '',
    activity: '',
    subsidyId: '',
    notes: '',
  })
  const [attSaving, setAttSaving] = useState(false)

  // Earning modal
  const [showErnModal, setShowErnModal] = useState(false)
  const [ernForm, setErnForm] = useState({
    description: '',
    amount: '',
    periodMonth: new Date().toISOString().slice(0, 7),
    status: '待結算',
  })
  const [ernSaving, setErnSaving] = useState(false)

  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleAddAttendance = async () => {
    if (!attForm.attendanceDate) {
      toast.error('請填寫出勤日期')
      return
    }
    setAttSaving(true)
    try {
      const res = await fetch(`/api/partners/${partner.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attForm),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAttendance([data, ...attendance])
      toast.success('出勤已新增')
      setShowAttModal(false)
      setAttForm({
        attendanceDate: new Date().toISOString().slice(0, 10),
        checkInTime: '',
        checkOutTime: '',
        activity: '',
        subsidyId: '',
        notes: '',
      })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAttSaving(false)
    }
  }

  const handleAddEarning = async () => {
    if (!ernForm.amount) {
      toast.error('請填寫金額')
      return
    }
    setErnSaving(true)
    try {
      const res = await fetch(`/api/partners/${partner.id}/earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ernForm),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEarnings([data, ...earnings])
      toast.success('酬勞已新增')
      setShowErnModal(false)
      setErnForm({
        description: '',
        amount: '',
        periodMonth: new Date().toISOString().slice(0, 7),
        status: '待結算',
      })
    } catch {
      toast.error('新增失敗')
    } finally {
      setErnSaving(false)
    }
  }

  const handleEarningStatus = async (earningId: string, newStatus: string) => {
    setUpdatingId(earningId)
    try {
      const res = await fetch(`/api/partners/${partner.id}/earnings/${earningId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setEarnings((es) => es.map((e) => (e.id === earningId ? { ...e, ...data } : e)))
      toast.success('狀態已更新')
    } catch {
      toast.error('更新失敗')
    } finally {
      setUpdatingId(null)
    }
  }

  const infoRows: Array<[string, string]> = [
    ['姓名', partner.name],
    ['障礙類別', partner.disability_type || '—'],
    ['障礙等級', partner.disability_level || '—'],
    ['技能等級', partner.skill_level || '—'],
    ['僱用型態', partner.employment_type || '—'],
    ['到職日', formatDate(partner.onboarded_at)],
    ['狀態', partner.status],
  ]

  const sectionStyle = { background: '#111', border: '1px solid #1f1f1f' } as const

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <h2 className="section-title mb-4">基本資料</h2>
        <div className="grid grid-cols-2 gap-3">
          {infoRows.map(([label, val]) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>
                {label}
              </p>
              <p className="text-sm text-white mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">出勤記錄 ({attendance.length})</h2>
          <CanEdit>
            <button onClick={() => setShowAttModal(true)} className="btn-secondary text-xs">
              + 新增出勤
            </button>
          </CanEdit>
        </div>
        {attendance.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#666' }}>
            尚無出勤記錄
          </p>
        ) : (
          <div className="space-y-2">
            {attendance.map((a) => (
              <div
                key={a.id}
                className="rounded-lg p-3 text-sm"
                style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium tabular-nums">{formatDate(a.attendance_date)}</span>
                    {a.check_in_time && (
                      <span className="text-xs" style={{ color: '#888' }}>
                        {a.check_in_time.slice(0, 5)} – {a.check_out_time?.slice(0, 5) || '—'}
                      </span>
                    )}
                    {a.hours_worked != null && (
                      <span className="badge badge-amber">{a.hours_worked}h</span>
                    )}
                  </div>
                  {a.subsidy?.subsidy_name && (
                    <span className="text-xs" style={{ color: '#34d399' }}>
                      {a.subsidy.subsidy_name}
                    </span>
                  )}
                </div>
                {(a.activity || a.notes) && (
                  <p className="text-xs mt-1" style={{ color: '#888' }}>
                    {a.activity}
                    {a.notes ? ` · ${a.notes}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">酬勞記錄 ({earnings.length})</h2>
          <CanEdit>
            <button onClick={() => setShowErnModal(true)} className="btn-secondary text-xs">
              + 新增酬勞
            </button>
          </CanEdit>
        </div>
        {earnings.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#666' }}>
            尚無酬勞記錄
          </p>
        ) : (
          <div className="space-y-2">
            {earnings.map((e) => {
              const style = EARNING_STATUS_STYLE[e.status] || EARNING_STATUS_STYLE['待結算']
              return (
                <div
                  key={e.id}
                  className="rounded-lg p-3"
                  style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white tabular-nums">
                        {formatNTD(e.amount)}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: style.bg,
                          color: style.color,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {e.status}
                      </span>
                      {e.period_month && (
                        <span className="text-xs" style={{ color: '#666' }}>
                          {e.period_month}
                        </span>
                      )}
                    </div>
                    <CanEdit>
                      <div className="flex gap-1">
                        {e.status === '待結算' && isAdmin && (
                          <button
                            onClick={() => handleEarningStatus(e.id, '已累積')}
                            disabled={updatingId === e.id}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: 'rgba(14,165,233,0.15)',
                              color: '#38bdf8',
                              border: '1px solid rgba(14,165,233,0.3)',
                            }}
                          >
                            批核
                          </button>
                        )}
                        {e.status === '已累積' && (
                          <button
                            onClick={() => handleEarningStatus(e.id, '已支付')}
                            disabled={updatingId === e.id}
                            className="text-xs px-2 py-1 rounded"
                            style={{
                              background: 'rgba(16,185,129,0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16,185,129,0.3)',
                            }}
                          >
                            標記已付
                          </button>
                        )}
                      </div>
                    </CanEdit>
                  </div>
                  {(e.description || e.task) && (
                    <p className="text-xs" style={{ color: '#888' }}>
                      {e.description || ''}
                      {e.task ? ` · ${e.task.title}${e.task.project ? ` (${e.task.project.name})` : ''}` : ''}
                    </p>
                  )}
                  {(e.approved_at || e.paid_at) && (
                    <p className="text-[10px] mt-1" style={{ color: '#555' }}>
                      {e.approved_at ? `批核 ${formatDate(e.approved_at)}` : ''}
                      {e.paid_at ? ` · 支付 ${formatDate(e.paid_at)}` : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      {showAttModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 w-[28rem]" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
            <h3 className="font-semibold text-white mb-4">新增出勤</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>出勤日期 *</label>
                <input
                  type="date"
                  value={attForm.attendanceDate}
                  onChange={(e) => setAttForm((f) => ({ ...f, attendanceDate: e.target.value }))}
                  className="input-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>上班時間</label>
                  <input
                    type="time"
                    value={attForm.checkInTime}
                    onChange={(e) => setAttForm((f) => ({ ...f, checkInTime: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>下班時間</label>
                  <input
                    type="time"
                    value={attForm.checkOutTime}
                    onChange={(e) => setAttForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>工作內容</label>
                <input
                  value={attForm.activity}
                  onChange={(e) => setAttForm((f) => ({ ...f, activity: e.target.value }))}
                  className="input-base"
                  placeholder="AI影片剪輯、SEO配圖..."
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>關聯補助</label>
                <select
                  value={attForm.subsidyId}
                  onChange={(e) => setAttForm((f) => ({ ...f, subsidyId: e.target.value }))}
                  className="input-base"
                >
                  <option value="">無</option>
                  {subsidies.map((s) => (
                    <option key={s.id} value={s.id}>{s.subsidy_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>備註</label>
                <textarea
                  rows={2}
                  value={attForm.notes}
                  onChange={(e) => setAttForm((f) => ({ ...f, notes: e.target.value }))}
                  className="input-base resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddAttendance} disabled={attSaving} className="flex-1 btn-primary">
                {attSaving ? '新增中...' : '確認新增'}
              </button>
              <button onClick={() => setShowAttModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Earning Modal */}
      {showErnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 w-[28rem]" style={{ background: '#111', border: '1px solid #1f1f1f' }}>
            <h3 className="font-semibold text-white mb-4">新增酬勞</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>項目說明</label>
                <input
                  value={ernForm.description}
                  onChange={(e) => setErnForm((f) => ({ ...f, description: e.target.value }))}
                  className="input-base"
                  placeholder="4月份薪資、專案酬勞..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>金額 *</label>
                  <input
                    type="number"
                    min="0"
                    value={ernForm.amount}
                    onChange={(e) => setErnForm((f) => ({ ...f, amount: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#888' }}>結算月份</label>
                  <input
                    type="month"
                    value={ernForm.periodMonth}
                    onChange={(e) => setErnForm((f) => ({ ...f, periodMonth: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: '#888' }}>初始狀態</label>
                <select
                  value={ernForm.status}
                  onChange={(e) => setErnForm((f) => ({ ...f, status: e.target.value }))}
                  className="input-base"
                >
                  {EARNING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddEarning} disabled={ernSaving} className="flex-1 btn-primary">
                {ernSaving ? '新增中...' : '確認新增'}
              </button>
              <button onClick={() => setShowErnModal(false)} className="flex-1 btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
