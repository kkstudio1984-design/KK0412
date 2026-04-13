'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { CourseSession, SessionStatus, SESSION_STATUSES } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  courseId: string
  courseName: string
  maxParticipants: number
  initialSessions: CourseSession[]
}

const STATUS_STYLES: Record<string, string> = {
  '規劃中': 'text-stone-600 bg-stone-50 border-stone-200',
  '報名中': 'text-blue-700 bg-blue-50 border-blue-200',
  '已額滿': 'text-amber-700 bg-amber-50 border-amber-200',
  '已結束': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '已取消': 'text-red-700 bg-red-50 border-red-200',
}

export default function SessionList({ courseId, courseName, maxParticipants, initialSessions }: Props) {
  const [sessions, setSessions] = useState<CourseSession[]>(initialSessions)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const [sessionForm, setSessionForm] = useState({
    sessionDate: '',
    startTime: '',
    location: '',
    orgId: '',
  })

  const [enrollForm, setEnrollForm] = useState({
    participantName: '',
    participantEmail: '',
    orgId: '',
  })

  const handleAddSession = async () => {
    if (!sessionForm.sessionDate) { toast.error('請選擇場次日期'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionForm),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: CourseSession = {
        id: data.id,
        courseId: data.course_id,
        sessionDate: data.session_date,
        startTime: data.start_time,
        location: data.location,
        orgId: data.org_id,
        status: data.status,
        actualParticipants: data.actual_participants,
        revenue: data.revenue,
        createdAt: data.created_at,
        enrollmentCount: 0,
      }
      setSessions([...sessions, mapped])
      toast.success('場次已建立')
      setShowSessionModal(false)
      setSessionForm({ sessionDate: '', startTime: '', location: '', orgId: '' })
    } catch {
      toast.error('新增場次失敗')
    } finally {
      setAdding(false)
    }
  }

  const handleStatusChange = async (sessionId: string, newStatus: SessionStatus) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s))
      toast.success('狀態已更新')
    } catch {
      toast.error('更新失敗')
    }
  }

  const handleAddEnrollment = async () => {
    if (!enrollForm.participantName || !showEnrollModal) { toast.error('請填寫學員姓名'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/sessions/${showEnrollModal}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollForm),
      })
      if (!res.ok) throw new Error()
      setSessions(sessions.map(s =>
        s.id === showEnrollModal
          ? { ...s, enrollmentCount: (s.enrollmentCount || 0) + 1 }
          : s
      ))
      toast.success('報名成功')
      setShowEnrollModal(null)
      setEnrollForm({ participantName: '', participantEmail: '', orgId: '' })
    } catch {
      toast.error('報名失敗')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-stone-800">場次列表</h2>
        <button onClick={() => setShowSessionModal(true)} className="btn-primary text-xs">+ 新增場次</button>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-6 text-center"><p className="text-sm text-stone-300">尚無場次</p></div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-stone-800">{formatDate(s.sessionDate)}</span>
                  {s.startTime && <span className="text-xs text-stone-500">{s.startTime}</span>}
                  {s.location && <span className="text-xs text-stone-400">@ {s.location}</span>}
                </div>
                <select
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.id, e.target.value as SessionStatus)}
                  className={`badge cursor-pointer text-xs ${STATUS_STYLES[s.status] || ''}`}
                >
                  {SESSION_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span>報名 {s.enrollmentCount || 0}/{maxParticipants} 人</span>
                  {s.actualParticipants != null && <span>實到 {s.actualParticipants} 人</span>}
                  {s.revenue != null && <span>營收 NT${s.revenue.toLocaleString()}</span>}
                </div>
                <button
                  onClick={() => setShowEnrollModal(s.id)}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  + 新增報名
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增場次</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">場次日期</label>
                <input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm(f => ({ ...f, sessionDate: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">開始時間</label>
                <input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm(f => ({ ...f, startTime: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">地點</label>
                <input value={sessionForm.location} onChange={(e) => setSessionForm(f => ({ ...f, location: e.target.value }))} className="input-base" placeholder="光合空間 3F" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">委託企業 ID（選填）</label>
                <input value={sessionForm.orgId} onChange={(e) => setSessionForm(f => ({ ...f, orgId: e.target.value }))} className="input-base" placeholder="組織 UUID" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddSession} disabled={adding} className="flex-1 btn-primary">{adding ? '建立中...' : '確認建立'}</button>
              <button onClick={() => setShowSessionModal(false)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增報名</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">學員姓名</label>
                <input value={enrollForm.participantName} onChange={(e) => setEnrollForm(f => ({ ...f, participantName: e.target.value }))} className="input-base" placeholder="王小明" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">Email（選填）</label>
                <input type="email" value={enrollForm.participantEmail} onChange={(e) => setEnrollForm(f => ({ ...f, participantEmail: e.target.value }))} className="input-base" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">所屬企業 ID（選填）</label>
                <input value={enrollForm.orgId} onChange={(e) => setEnrollForm(f => ({ ...f, orgId: e.target.value }))} className="input-base" placeholder="組織 UUID" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAddEnrollment} disabled={adding} className="flex-1 btn-primary">{adding ? '報名中...' : '確認報名'}</button>
              <button onClick={() => setShowEnrollModal(null)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
