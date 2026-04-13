'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { ClientDocument, DocumentStatus } from '@/lib/types'

interface Props {
  clientId: string
  initialDocuments: ClientDocument[]
}

const STATUS_STYLES: Record<DocumentStatus, string> = {
  '未繳': 'text-red-700 bg-red-50 border-red-200',
  '已繳': 'text-green-700 bg-green-50 border-green-200',
  '待補正': 'text-yellow-700 bg-yellow-50 border-yellow-200',
}

const STATUS_ICON: Record<DocumentStatus, string> = {
  '未繳': '○',
  '已繳': '●',
  '待補正': '◐',
}

export default function DocumentChecklist({ clientId, initialDocuments }: Props) {
  const [docs, setDocs] = useState<ClientDocument[]>(initialDocuments)
  const [updating, setUpdating] = useState<string | null>(null)

  const requiredCount = docs.filter((d) => d.required).length
  const requiredCompleted = docs.filter((d) => d.required && d.status === '已繳').length

  const handleChange = async (docId: string, status: DocumentStatus) => {
    setUpdating(docId)
    const prev = docs
    setDocs((ds) => ds.map((d) => (d.id === docId ? { ...d, status } : d)))

    try {
      const res = await fetch(`/api/clients/${clientId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, status }),
      })
      if (!res.ok) throw new Error()
      toast.success('文件狀態已更新')
    } catch {
      toast.error('更新失敗')
      setDocs(prev)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-gray-800">文件檢核</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
          requiredCompleted === requiredCount
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-yellow-700 bg-yellow-50 border-yellow-200'
        }`}>
          必要 {requiredCompleted} / {requiredCount}
        </span>
      </div>

      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className={`text-sm shrink-0 ${doc.status === '已繳' ? 'text-green-600' : doc.status === '待補正' ? 'text-yellow-600' : 'text-gray-400'}`}>
                {STATUS_ICON[doc.status]}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {doc.documentType}
                {doc.required && <span className="text-red-400 ml-0.5">*</span>}
              </span>
            </div>
            <select
              value={doc.status}
              disabled={updating === doc.id}
              onChange={(e) => handleChange(doc.id, e.target.value as DocumentStatus)}
              className={`text-xs font-medium border rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 ${STATUS_STYLES[doc.status]}`}
            >
              <option value="未繳">未繳</option>
              <option value="已繳">已繳</option>
              <option value="待補正">待補正</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
