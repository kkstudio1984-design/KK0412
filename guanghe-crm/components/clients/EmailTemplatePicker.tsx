'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Template {
  id: string
  name: string
  template_key: string
  category: string
  subject: string
  body: string
  variables: string[]
}

interface ClientContext {
  client_name: string
  contact_name: string
  service_type: string
  plan?: string
  monthly_fee?: number
  contact_email?: string | null
}

interface Props {
  clientContext: ClientContext
}

function substitute(text: string, data: Record<string, string>): string {
  let result = text
  for (const [k, v] of Object.entries(data)) {
    result = result.split(k).join(v)
  }
  return result
}

export default function EmailTemplatePicker({ clientContext }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [loading, setLoading] = useState(false)

  const data: Record<string, string> = {
    '{{client_name}}': clientContext.client_name,
    '{{contact_name}}': clientContext.contact_name,
    '{{service_type}}': clientContext.service_type,
    '{{plan}}': clientContext.plan || '—',
    '{{monthly_fee}}': clientContext.monthly_fee ? String(clientContext.monthly_fee.toLocaleString()) : '0',
  }

  const handleOpen = async () => {
    setOpen(true)
    if (templates.length === 0) {
      setLoading(true)
      try {
        const res = await fetch('/api/email-templates')
        if (res.ok) {
          const data = await res.json()
          setTemplates(data.filter((t: Template & { is_active: boolean }) => t.is_active))
        }
      } catch {} finally { setLoading(false) }
    }
  }

  const previewSubject = selected ? substitute(selected.subject, data) : ''
  const previewBody = selected ? substitute(selected.body, data) : ''

  const copyAll = () => {
    navigator.clipboard.writeText(`主旨：${previewSubject}\n\n${previewBody}`)
    toast.success('已複製，可貼到 Gmail')
  }

  const openGmail = () => {
    const to = clientContext.contact_email || ''
    const params = new URLSearchParams({
      to,
      su: previewSubject,
      body: previewBody,
    })
    const url = `https://mail.google.com/mail/?view=cm&fs=1&${params.toString()}`
    window.open(url, '_blank')
  }

  return (
    <>
      <button onClick={handleOpen} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: '#1a1a1a', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.3)' }}>
        📧 寄信範本
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setOpen(false); setSelected(null) }}>
          <div className="rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" style={{ background: '#111', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            {!selected ? (
              <>
                <div className="p-5" style={{ borderBottom: '1px solid #222' }}>
                  <h3 className="font-semibold text-white">選擇 Email 範本</h3>
                  <p className="text-xs mt-1" style={{ color: '#888' }}>將自動帶入 {clientContext.client_name} 的資料</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <p className="text-sm text-center py-8" style={{ color: '#666' }}>載入中...</p>
                  ) : templates.length === 0 ? (
                    <p className="text-sm text-center py-8" style={{ color: '#666' }}>無可用範本</p>
                  ) : (
                    <div className="space-y-2">
                      {templates.map(t => (
                        <button key={t.id} onClick={() => setSelected(t)} className="w-full text-left p-3 rounded-lg hover:bg-[#1a1a1a]" style={{ background: '#0a0a0a', border: '1px solid #1f1f1f' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white">{t.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#888' }}>{t.category}</span>
                          </div>
                          <p className="text-xs truncate" style={{ color: '#888' }}>{t.subject}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #222' }}>
                  <div>
                    <h3 className="font-semibold text-white">{selected.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>預覽（已代入客戶資料）</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-xs" style={{ color: '#888' }}>← 返回</button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="rounded-lg p-4" style={{ background: '#0a0a0a', border: '1px solid #1f1f1f' }}>
                    <p className="text-xs mb-1" style={{ color: '#666' }}>主旨</p>
                    <p className="font-semibold text-white mb-4">{previewSubject}</p>
                    <p className="text-xs mb-1" style={{ color: '#666' }}>內文</p>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: '#c8c4be', lineHeight: '1.7' }}>{previewBody}</p>
                  </div>
                </div>
                <div className="p-5 flex gap-2" style={{ borderTop: '1px solid #222' }}>
                  <button onClick={copyAll} className="flex-1 btn-secondary">📋 複製</button>
                  {clientContext.contact_email && (
                    <button onClick={openGmail} className="flex-1 btn-primary">📧 在 Gmail 開啟</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
