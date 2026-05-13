'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useRole } from '@/components/providers/RoleProvider'

const STATUS_OPTIONS = ['培訓中', '實習中', '執業中', '暫停中', '離開'] as const
type StudentStatus = (typeof STATUS_OPTIONS)[number]

const DISABILITY_TYPES = ['視障', '聽障', '肢障', '心智', '多重', '其他'] as const
const DISABILITY_LEVELS = ['輕度', '中度', '重度', '極重度'] as const

export default function StudentForm() {
  const router = useRouter()
  const { canEdit, loading: roleLoading } = useRole()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    // 必填
    code: '',
    displayName: '',
    status: '培訓中' as StudentStatus,
    // 建議填
    realName: '',
    age: '',
    gender: '',
    cohort: '',
    disabilityType: '',
    disabilityLevel: '',
    joinedAt: '',
    stipendMonthly: '',
  })

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('請填寫學員代碼'); return }
    if (!form.displayName.trim()) { toast.error('請填寫對外稱呼'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? '新增失敗')
        return
      }

      toast.success('學員新增成功！')
      router.push('/students')
      router.refresh()
    } catch {
      toast.error('網路錯誤，請重試')
    } finally {
      setLoading(false)
    }
  }

  if (roleLoading) return <div className="text-sm text-gray-400">載入中...</div>
  if (!canEdit) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-500">您無權限新增學員</p>
      </div>
    )
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── 必填 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          基本識別
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              學員代碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => set('code', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="A、B、2026-001"
            />
            <p className="text-xs text-gray-400 mt-1">不重複的短碼，用於內部辨識</p>
          </div>

          <div>
            <label className={labelCls}>
              對外稱呼 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="學員 A、小晴"
            />
            <p className="text-xs text-gray-400 mt-1">可為代稱，避免直接寫本名</p>
          </div>

          <div>
            <label className={labelCls}>狀態</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={`${inputCls} bg-white`}
              style={{ color: '#111', background: '#fff' }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>期別</label>
            <input
              type="text"
              value={form.cohort}
              onChange={(e) => set('cohort', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="2026-Q2"
            />
          </div>
        </div>
      </section>

      {/* ── 個人資料 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          個人資料（選填）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>本名</label>
            <input
              type="text"
              value={form.realName}
              onChange={(e) => set('realName', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="僅內部使用"
            />
          </div>

          <div>
            <label className={labelCls}>年齡</label>
            <input
              type="number"
              min="0"
              max="120"
              value={form.age}
              onChange={(e) => set('age', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="35"
            />
          </div>

          <div>
            <label className={labelCls}>性別</label>
            <input
              type="text"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="自填即可"
            />
          </div>

          <div>
            <label className={labelCls}>加入培訓日期</label>
            <input
              type="date"
              value={form.joinedAt}
              onChange={(e) => set('joinedAt', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
            />
          </div>
        </div>
      </section>

      {/* ── 身障狀況 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          身障狀況（選填，高敏感）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>類別</label>
            <select
              value={form.disabilityType}
              onChange={(e) => set('disabilityType', e.target.value)}
              className={`${inputCls} bg-white`}
              style={{ color: '#111', background: '#fff' }}
            >
              <option value="">—</option>
              {DISABILITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>程度</label>
            <select
              value={form.disabilityLevel}
              onChange={(e) => set('disabilityLevel', e.target.value)}
              className={`${inputCls} bg-white`}
              style={{ color: '#111', background: '#fff' }}
            >
              <option value="">—</option>
              {DISABILITY_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          身障手冊號等合規資料須等學員當面同意後，於詳情頁補登。
        </p>
      </section>

      {/* ── 培訓津貼 ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          財務（選填）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>培訓津貼（每月新台幣）</label>
            <input
              type="number"
              min="0"
              value={form.stipendMonthly}
              onChange={(e) => set('stipendMonthly', e.target.value)}
              className={inputCls}
              style={{ color: '#111', background: '#fff' }}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* ── 送出 ── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          {loading ? '新增中...' : '新增學員'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2.5"
        >
          取消
        </button>
      </div>
    </form>
  )
}
