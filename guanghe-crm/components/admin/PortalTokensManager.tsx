'use client'

import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'

interface OrgRef {
  name: string
}

interface SpaceClientRef {
  service_type: string
  organizations: OrgRef | OrgRef[] | null
}

interface TokenRow {
  token: string
  space_client_id: string
  expires_at: string
  first_accessed_at: string | null
  last_accessed_at: string | null
  access_count: number
  notes: string | null
  created_at: string
  space_clients: SpaceClientRef | SpaceClientRef[] | null
}

interface ClientOption {
  id: string
  service_type: string
  stage: string
  organizations: OrgRef | OrgRef[] | null
}

interface Props {
  initialTokens: TokenRow[]
  clients: ClientOption[]
}

export default function PortalTokensManager({ initialTokens, clients }: Props) {
  const [tokens, setTokens] = useState(initialTokens)
  const [pending, startTransition] = useTransition()
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)

  // Generate form state
  const [selectedClient, setSelectedClient] = useState('')
  const [ttlDays, setTtlDays] = useState(30)
  const [notes, setNotes] = useState('')

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) {
      toast.error('請選擇客戶')
      return
    }

    startTransition(async () => {
      try {
        const resp = await fetch('/api/portal/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceClientId: selectedClient,
            ttlDays,
            notes: notes || undefined,
          }),
        })
        const data = await resp.json()
        if (!resp.ok) {
          toast.error(data.error || `Generate failed (${resp.status})`)
          return
        }
        setGeneratedUrl(data.url)
        toast.success(`Token 已生成、有效 ${ttlDays} 天`)
        // 重新 fetch 列表（簡單做法：reload；更好的做法是 optimistic update）
        window.location.reload()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Network error')
      }
    })
  }

  async function handleRevoke(token: string) {
    if (!confirm('確定撤銷此 token？客戶連結將立即失效。')) return

    startTransition(async () => {
      try {
        const resp = await fetch('/api/portal/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await resp.json()
        if (!resp.ok) {
          toast.error(data.error || `Revoke failed (${resp.status})`)
          return
        }
        setTokens((prev) => prev.filter((t) => t.token !== token))
        toast.success('Token 已撤銷')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Network error')
      }
    })
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('已複製連結')
    } catch {
      toast.error('複製失敗、請手動選取')
    }
  }

  return (
    <div className="space-y-8">
      {/* Generate form */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-lg font-medium mb-4">產生新 Token</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-zinc-600 mb-1 block">客戶</span>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                required
                className="w-full border border-zinc-300 rounded px-3 py-2 text-sm"
              >
                <option value="">請選擇客戶...</option>
                {clients.map((c) => {
                  const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations
                  return (
                    <option key={c.id} value={c.id}>
                      {org?.name || '（未知）'} · {c.service_type} · {c.stage}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-zinc-600 mb-1 block">有效天數（1-365）</span>
              <input
                type="number"
                min={1}
                max={365}
                value={ttlDays}
                onChange={(e) => setTtlDays(Number(e.target.value))}
                className="w-full border border-zinc-300 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-zinc-600 mb-1 block">備註（選填、最多 200 字）</span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="例：寄給嚴總 6/17"
              className="w-full border border-zinc-300 rounded px-3 py-2 text-sm"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-300 text-white px-5 py-2 rounded text-sm font-medium transition"
          >
            {pending ? '生成中...' : '產生 Token'}
          </button>
        </form>

        {generatedUrl && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded">
            <p className="text-xs text-emerald-700 mb-2 font-medium">
              新生成的客戶 Portal 連結（請複製傳給客戶、頁面 reload 後將不再顯示）：
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedUrl}
                readOnly
                className="flex-1 bg-white border border-emerald-300 rounded px-3 py-2 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(generatedUrl)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm"
              >
                複製
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Token list */}
      <section className="bg-white rounded-xl border border-zinc-200">
        <div className="p-6 pb-4">
          <h2 className="text-lg font-medium">既有 Token 列表（近 100 筆）</h2>
          <p className="text-xs text-zinc-500 mt-1">
            包含已過期的 token。已過期 token 客戶連結無作用、可手動撤銷清理。
          </p>
        </div>

        {tokens.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-zinc-500">尚未產生任何 token。</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-zinc-600 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">客戶</th>
                  <th className="text-left px-4 py-2 font-medium">產生於</th>
                  <th className="text-left px-4 py-2 font-medium">過期</th>
                  <th className="text-left px-4 py-2 font-medium">訪問次數</th>
                  <th className="text-left px-4 py-2 font-medium">備註</th>
                  <th className="text-right px-4 py-2 font-medium">動作</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => {
                  const sc = Array.isArray(t.space_clients) ? t.space_clients[0] : t.space_clients
                  const org = sc ? (Array.isArray(sc.organizations) ? sc.organizations[0] : sc.organizations) : null
                  const expired = new Date(t.expires_at) < new Date()
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/portal/${t.token}`
                  return (
                    <tr key={t.token} className="border-t border-zinc-100">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-800">{org?.name || '（未知）'}</div>
                        <div className="text-xs text-zinc-500">{sc?.service_type || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600">{formatDateTime(t.created_at)}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={expired ? 'text-rose-600' : 'text-zinc-700'}>
                          {formatDateTime(t.expires_at)}
                          {expired && <span className="ml-2 text-rose-600">已過期</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {t.access_count > 0 ? (
                          <span>
                            {t.access_count} 次
                            {t.last_accessed_at && (
                              <span className="block text-xs text-zinc-500">
                                上次 {formatDateTime(t.last_accessed_at)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-zinc-400">尚未訪問</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 max-w-[180px] truncate">
                        {t.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="text-emerald-600 hover:text-emerald-800 text-xs mr-3"
                        >
                          複製連結
                        </button>
                        <button
                          onClick={() => handleRevoke(t.token)}
                          disabled={pending}
                          className="text-rose-600 hover:text-rose-800 text-xs disabled:opacity-50"
                        >
                          撤銷
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
