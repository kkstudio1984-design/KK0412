'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Course, CourseType, COURSE_TYPES } from '@/lib/types'
import { formatNTD } from '@/lib/utils'
import Link from 'next/link'
import { CanEdit } from '@/components/providers/RoleProvider'

interface Props {
  initialCourses: Course[]
}

const TYPE_STYLES: Record<string, string> = {
  '同理心體驗': 'text-pink-700 bg-pink-50 border-pink-200',
  '企業培訓': 'text-blue-700 bg-blue-50 border-blue-200',
  'AI工具工作坊': 'text-purple-700 bg-purple-50 border-purple-200',
  '夥伴內訓': 'text-amber-700 bg-amber-50 border-amber-200',
}

export default function CourseList({ initialCourses }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    courseType: '同理心體驗' as CourseType,
    durationHours: '',
    price: '',
    maxParticipants: '',
    description: '',
  })

  const handleAdd = async () => {
    if (!form.name) { toast.error('請填寫課程名稱'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: Course = {
        id: data.id,
        name: data.name,
        courseType: data.course_type,
        durationHours: data.duration_hours,
        price: data.price,
        maxParticipants: data.max_participants,
        description: data.description,
        createdAt: data.created_at,
        sessions: [],
      }
      setCourses([mapped, ...courses])
      toast.success('課程已建立')
      setShowModal(false)
      setForm({ name: '', courseType: '同理心體驗', durationHours: '', price: '', maxParticipants: '', description: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">共 {courses.length} 門課程</p>
        <CanEdit>
          <button onClick={() => setShowModal(true)} className="btn-primary">+ 新增課程</button>
        </CanEdit>
      </div>

      {courses.length === 0 ? (
        <div className="card p-8 text-center"><p className="text-sm text-stone-300">尚無課程</p></div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => {
            const sessionCount = (c.sessions || []).length
            const activeCount = (c.sessions || []).filter((s: any) => s.status === '報名中' || s.status === '規劃中').length
            return (
              <Link key={c.id} href={`/training/${c.id}`} className="card p-5 block hover:border-amber-300">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-stone-800">{c.name}</h3>
                  <span className={`badge ${TYPE_STYLES[c.courseType] || ''}`}>{c.courseType}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-stone-500">
                  <span>{c.durationHours} 小時</span>
                  <span>{formatNTD(c.price)}</span>
                  <span>上限 {c.maxParticipants} 人</span>
                  <span>{sessionCount} 場次{activeCount > 0 ? `（${activeCount} 進行中）` : ''}</span>
                </div>
                {c.description && (
                  <p className="text-xs text-stone-400 mt-1.5 truncate">{c.description}</p>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-stone-800 mb-4">新增課程</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">課程名稱</label>
                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="同理心體驗工作坊" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">課程類型</label>
                <select value={form.courseType} onChange={(e) => setForm(f => ({ ...f, courseType: e.target.value as CourseType }))} className="input-base">
                  {COURSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">時數（小時）</label>
                  <input type="number" min="0.5" step="0.5" value={form.durationHours} onChange={(e) => setForm(f => ({ ...f, durationHours: e.target.value }))} className="input-base" placeholder="2" />
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">定價（NT$）</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} className="input-base" placeholder="3000" />
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">人數上限</label>
                <input type="number" min="1" value={form.maxParticipants} onChange={(e) => setForm(f => ({ ...f, maxParticipants: e.target.value }))} className="input-base" placeholder="30" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">課程說明</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="input-base resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">{adding ? '建立中...' : '確認建立'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
