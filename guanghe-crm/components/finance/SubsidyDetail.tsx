'use client'

import { formatDate, formatNTD } from '@/lib/utils'

interface Subsidy {
  id: string
  subsidy_name: string
  agency: string
  annual_amount: number
  application_status: string
  disbursement_status: string
  notes: string | null
}

interface AttendanceRow {
  id: string
  partner_id: string
  attendance_date: string
  hours_worked: number | null
  activity: string | null
  check_in_time: string | null
  check_out_time: string | null
  partner?: { name: string; disability_type: string | null } | null
}

interface Props {
  subsidy: Subsidy
  attendance: AttendanceRow[]
}

export default function SubsidyDetail({ subsidy, attendance }: Props) {
  // Aggregate by partner
  const byPartner: Record<string, { name: string; disability: string | null; hours: number; days: Set<string> }> = {}
  let totalHours = 0
  for (const a of attendance) {
    const pid = a.partner_id
    const h = a.hours_worked || 0
    if (!byPartner[pid]) {
      byPartner[pid] = {
        name: a.partner?.name || '—',
        disability: a.partner?.disability_type || null,
        hours: 0,
        days: new Set(),
      }
    }
    byPartner[pid].hours += h
    byPartner[pid].days.add(a.attendance_date)
    totalHours += h
  }

  const partnerRows = Object.entries(byPartner)
    .map(([id, v]) => ({ id, name: v.name, disability: v.disability, hours: v.hours, days: v.days.size }))
    .sort((a, b) => b.hours - a.hours)

  const sectionStyle = { background: '#111', border: '1px solid #1f1f1f' } as const

  return (
    <div className="space-y-4">
      {/* Subsidy info */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <h2 className="section-title mb-4">補助資訊</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>補助名稱</p>
            <p className="text-sm text-white mt-0.5">{subsidy.subsidy_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>主管機關</p>
            <p className="text-sm text-white mt-0.5">{subsidy.agency}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>年度金額</p>
            <p className="text-sm text-white mt-0.5 tabular-nums">{formatNTD(subsidy.annual_amount)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>申請狀態</p>
            <p className="text-sm text-white mt-0.5">{subsidy.application_status} · {subsidy.disbursement_status}</p>
          </div>
        </div>
        {subsidy.notes && (
          <p className="text-xs mt-3 pt-3" style={{ color: '#888', borderTop: '1px solid #1a1a1a' }}>
            {subsidy.notes}
          </p>
        )}
      </div>

      {/* Aggregated stats */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">夥伴出勤統計</h2>
          <span className="text-xs" style={{ color: '#888' }}>
            總時數 <span className="text-white font-semibold tabular-nums">{totalHours.toFixed(2)}h</span> · {attendance.length} 筆記錄
          </span>
        </div>
        {partnerRows.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#666' }}>
            尚無關聯的出勤記錄
          </p>
        ) : (
          <div className="space-y-2">
            {partnerRows.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}
              >
                <div>
                  <p className="text-sm text-white font-medium">{p.name}</p>
                  <p className="text-xs" style={{ color: '#666' }}>{p.disability || '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white tabular-nums">{p.hours.toFixed(2)}h</p>
                  <p className="text-xs" style={{ color: '#666' }}>{p.days} 天</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw list */}
      <div className="rounded-xl p-5" style={sectionStyle}>
        <h2 className="section-title mb-4">出勤明細 ({attendance.length})</h2>
        {attendance.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#666' }}>尚無記錄</p>
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
                    <span className="text-xs" style={{ color: '#888' }}>{a.partner?.name || '—'}</span>
                    {a.check_in_time && (
                      <span className="text-xs" style={{ color: '#666' }}>
                        {a.check_in_time.slice(0, 5)} – {a.check_out_time?.slice(0, 5) || '—'}
                      </span>
                    )}
                  </div>
                  {a.hours_worked != null && <span className="badge badge-amber">{a.hours_worked}h</span>}
                </div>
                {a.activity && (
                  <p className="text-xs mt-1" style={{ color: '#888' }}>{a.activity}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
