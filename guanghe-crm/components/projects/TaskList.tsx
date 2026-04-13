'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Task, TaskStatus, TASK_STATUSES } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface Props {
  projectId: string
  initialTasks: Task[]
}

const STATUS_STYLES: Record<TaskStatus, string> = {
  '待分配': 'text-stone-500 bg-stone-50 border-stone-200',
  '進行中': 'text-blue-700 bg-blue-50 border-blue-200',
  '待審核': 'text-amber-700 bg-amber-50 border-amber-200',
  '完成': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  '退回': 'text-red-700 bg-red-50 border-red-200',
}

export default function TaskList({ projectId, initialTasks }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showModal, setShowModal] = useState(false)
  const [adding, setAdding] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', dueDate: '' })

  const handleAdd = async () => {
    if (!form.title) { toast.error('請填寫任務名稱'); return }
    setAdding(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: Task = {
        id: data.id, projectId: data.project_id, partnerId: data.partner_id,
        title: data.title, status: data.status, dueDate: data.due_date,
        outputUrl: data.output_url, reviewNotes: data.review_notes,
        createdAt: data.created_at, updatedAt: data.updated_at,
      }
      setTasks([...tasks, mapped])
      toast.success('任務已新增')
      setShowModal(false)
      setForm({ title: '', dueDate: '' })
    } catch {
      toast.error('新增失敗')
    } finally {
      setAdding(false)
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    setUpdating(taskId)
    const prev = tasks
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status } : t))
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success('任務狀態已更新')
    } catch {
      toast.error('更新失敗')
      setTasks(prev)
    } finally {
      setUpdating(null)
    }
  }

  const doneCount = tasks.filter(t => t.status === '完成').length

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-stone-800">任務列表</h2>
          <span className="text-xs text-stone-400">{doneCount}/{tasks.length} 完成</span>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-xs px-3 py-1.5">+ 新增任務</button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-stone-300 text-center py-6">尚無任務</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-700">{task.title}</p>
                {task.dueDate && <p className="text-xs text-stone-400">截止 {formatDate(task.dueDate)}</p>}
              </div>
              <select
                value={task.status}
                disabled={updating === task.id}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                className={`badge cursor-pointer disabled:opacity-50 ${STATUS_STYLES[task.status]}`}
              >
                {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96">
            <h3 className="font-semibold text-stone-800 mb-4">新增任務</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-stone-500 mb-1 block">任務名稱</label>
                <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="input-base" placeholder="拍攝腳本撰寫" />
              </div>
              <div>
                <label className="text-xs text-stone-500 mb-1 block">截止日期</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-base" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleAdd} disabled={adding} className="flex-1 btn-primary">{adding ? '新增中...' : '確認新增'}</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-stone-300 text-sm text-stone-600 py-2 rounded-lg hover:bg-stone-50">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
