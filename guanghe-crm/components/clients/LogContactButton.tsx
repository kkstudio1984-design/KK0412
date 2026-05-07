'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Props {
  clientId: string
}

export default function LogContactButton({ clientId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/log-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || '紀錄失敗')
        return
      }
      toast.success('已紀錄聯繫')
      setOpen(false)
      setNote('')
      router.refresh()
    } catch (err) {
      toast.error('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition font-medium"
      >
        ✓ 我已聯繫
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-2">紀錄聯繫</h3>
            <p className="text-sm text-gray-500 mb-4">
              標記「上次聯繫時間 = 現在」。可選填一段備註，會存進客戶資料供下次參考。
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value.slice(0, 500))}
              placeholder="例：電話聯繫，客戶說下週確認續約⋯（選填）"
              rows={4}
              className="w-full text-sm border border-stone-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => { setOpen(false); setNote('') }}
                disabled={submitting}
                className="text-sm px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-sm px-4 py-2 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition font-medium disabled:opacity-50"
              >
                {submitting ? '紀錄中⋯' : '確認紀錄'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
