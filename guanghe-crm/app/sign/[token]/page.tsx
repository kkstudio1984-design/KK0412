'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import SignaturePad from 'signature_pad'

interface ContractData {
  id: string
  signing_status: string
  signing_token_expires_at: string
  signed_at: string | null
  signer_name: string | null
  contract_type: string
  start_date: string
  end_date: string
  monthly_rent: number
  payment_cycle: string
  deposit_amount: number
  space_client: {
    id: string
    organization: {
      name: string
      contact_name: string
      tax_id: string | null
    }
  }
}

export default function SignPage() {
  const params = useParams()
  const token = params.token as string

  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signerName, setSignerName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<'signed' | 'rejected' | null>(null)
  const [hasSignature, setHasSignature] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setContract(data)
        if (data.signing_status === '已簽署') setDone('signed')
        if (data.signing_status === '已拒絕') setDone('rejected')
      })
      .catch(() => setError('無法載入合約資料'))
      .finally(() => setLoading(false))
  }, [token])

  // Initialize SignaturePad when canvas appears (after contract loads and not yet signed)
  useEffect(() => {
    if (!canvasRef.current || padRef.current) return
    if (!contract || done || contract.signing_status !== '待簽署') return

    const canvas = canvasRef.current
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      padRef.current?.clear()
      setHasSignature(false)
    }

    const pad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255,255,255)',
      penColor: 'rgb(17,17,17)',
      minWidth: 0.8,
      maxWidth: 2.4,
    })
    pad.addEventListener('endStroke', () => setHasSignature(!pad.isEmpty()))
    padRef.current = pad

    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      pad.off()
      padRef.current = null
    }
  }, [contract, done])

  const clearSignature = () => {
    padRef.current?.clear()
    setHasSignature(false)
  }

  const handleAction = async (action: 'sign' | 'reject') => {
    if (action === 'sign' && !agreed) return
    if (action === 'sign' && !signerName.trim()) return
    if (action === 'sign' && (!padRef.current || padRef.current.isEmpty())) {
      setError('請在下方簽名後再確認')
      setTimeout(() => setError(null), 3000)
      return
    }
    setSubmitting(true)
    try {
      const signatureImage = action === 'sign' && padRef.current
        ? padRef.current.toDataURL('image/png')
        : null
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName: signerName.trim(), action, signatureImage }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '操作失敗'); return }
      // Stamp the local contract state so the success screen can show signed_at/signer_name immediately
      setContract(prev => prev ? {
        ...prev,
        signing_status: action === 'sign' ? '已簽署' : '已拒絕',
        signed_at: new Date().toISOString(),
        signer_name: action === 'sign' ? signerName.trim() : prev.signer_name,
      } : prev)
      setDone(action === 'sign' ? 'signed' : 'rejected')
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (d: string) => {
    try { return format(new Date(d), 'yyyy年MM月dd日') } catch { return d }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#666', fontSize: '0.9rem' }}>載入中...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ color: '#f87171', fontSize: '1rem', marginBottom: '0.5rem' }}>{error}</p>
        <p style={{ color: '#555', fontSize: '0.8rem' }}>請聯繫光合創學客服人員</p>
      </div>
    </div>
  )

  if (done === 'signed') return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <p style={{ color: '#34d399', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>合約已完成電子簽署</p>
        <p style={{ color: '#666', fontSize: '0.85rem' }}>
          簽署人：{contract?.signer_name || signerName}<br />
          {contract?.signed_at && `簽署時間：${fmt(contract.signed_at)}`}
        </p>
        <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '1.5rem' }}>感謝您與光合創學的合作</p>
      </div>
    </div>
  )

  if (done === 'rejected') return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <p style={{ color: '#f87171', fontSize: '1.2rem', fontWeight: 600 }}>已拒絕簽署</p>
        <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>如有疑問請聯繫光合創學客服人員</p>
      </div>
    </div>
  )

  if (!contract) return null
  const isExpired = contract.signing_token_expires_at && new Date(contract.signing_token_expires_at) < new Date()
  const org = contract.space_client?.organization

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0a0a', fontWeight: 700, fontSize: '1.1rem' }}>光</div>
          <div>
            <p style={{ color: '#888', fontSize: '0.75rem', margin: 0 }}>光合創學 | Guanghe</p>
            <p style={{ color: '#e8e6e3', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>電子合約簽署</p>
          </div>
        </div>

        {isExpired && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.85rem' }}>
            ⚠️ 此簽署連結已過期，請聯繫光合創學重新發送
          </div>
        )}

        {/* Contract Summary */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#e8e6e3', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', margin: '0 0 1rem' }}>
            {contract.contract_type}合約書
          </h2>
          <p style={{ color: '#555', fontSize: '0.7rem', marginBottom: '1rem', margin: '0 0 1rem' }}>
            合約編號：GH-{contract.id.slice(0, 8).toUpperCase()}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#555', fontSize: '0.7rem', margin: '0 0 0.25rem' }}>出租方（甲方）</p>
              <p style={{ color: '#e8e6e3', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>光合創學有限公司</p>
            </div>
            <div>
              <p style={{ color: '#555', fontSize: '0.7rem', margin: '0 0 0.25rem' }}>承租方（乙方）</p>
              <p style={{ color: '#e8e6e3', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>{org?.name || '—'}</p>
              {org?.contact_name && <p style={{ color: '#888', fontSize: '0.75rem', margin: '0.15rem 0 0' }}>負責人：{org.contact_name}</p>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: '合約期間', value: `${fmt(contract.start_date)} ~ ${fmt(contract.end_date)}` },
              { label: '月租金', value: `NT$ ${contract.monthly_rent.toLocaleString()}` },
              { label: '繳款週期', value: contract.payment_cycle },
              { label: '押金', value: `NT$ ${contract.deposit_amount.toLocaleString()}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ color: '#555', fontSize: '0.7rem', margin: '0 0 0.2rem' }}>{label}</p>
                <p style={{ color: '#b0aca6', fontSize: '0.82rem', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key clauses summary */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>📋 重要條款摘要</p>
          <ul style={{ margin: 0, padding: '0 0 0 1.2rem', color: '#888', fontSize: '0.8rem', lineHeight: 1.8 }}>
            <li>乙方同意提供 KYC 查核所需資料，並保證真實無偽</li>
            <li>合約終止後 30 日內須完成公司登記地址遷出</li>
            <li>逾 30 日未遷出者，甲方得扣抵押金 50%；逾 60 日得沒收全額押金</li>
            <li>因本合約爭議，以臺灣台北地方法院為第一審管轄法院</li>
          </ul>
          <p style={{ color: '#555', fontSize: '0.72rem', marginTop: '0.75rem', margin: '0.75rem 0 0' }}>
            完整合約條款以書面合約為準，如有疑義請聯繫光合創學人員說明。
          </p>
        </div>

        {/* Sign form */}
        {!isExpired && contract.signing_status === '待簽署' && (
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
            <p style={{ color: '#e8e6e3', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', margin: '0 0 1rem' }}>簽署確認</p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#666', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
                簽署人姓名（負責人）<span style={{ color: '#f87171' }}> *</span>
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="請輸入負責人全名"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#e8e6e3',
                  borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>

            {/* Handwritten signature canvas */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ color: '#666', fontSize: '0.75rem' }}>
                  親筆簽名（手指或滑鼠）<span style={{ color: '#f87171' }}> *</span>
                </label>
                <button
                  type="button"
                  onClick={clearSignature}
                  style={{
                    background: 'transparent', border: 'none', color: '#888', fontSize: '0.72rem',
                    cursor: 'pointer', padding: '0.2rem 0.4rem',
                  }}
                >
                  清除重簽
                </button>
              </div>
              <div style={{
                position: 'relative', background: '#fff', borderRadius: '8px',
                border: '1px solid #2a2a2a', overflow: 'hidden',
              }}>
                <canvas
                  ref={canvasRef}
                  style={{
                    display: 'block', width: '100%', height: '180px', touchAction: 'none',
                    cursor: 'crosshair',
                  }}
                />
                {!hasSignature && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                    color: '#aaa', fontSize: '0.85rem',
                  }}>
                    在此處簽名
                  </div>
                )}
                {/* Baseline */}
                <div style={{
                  position: 'absolute', bottom: '20%', left: '5%', right: '5%',
                  borderBottom: '1px dashed #ddd', pointerEvents: 'none',
                }} />
              </div>
              <p style={{ color: '#444', fontSize: '0.68rem', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
                簽名筆跡將作為合約電子簽章存檔，具法律效力
              </p>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: '0.15rem', accentColor: '#d97706', width: '16px', height: '16px', flexShrink: 0 }}
              />
              <span style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.6 }}>
                本人已詳閱上述合約內容及重要條款，確認資料正確，同意以電子方式完成簽署，具有與書面簽署相同之法律效力。
              </span>
            </label>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(() => {
                const disabled = submitting || !agreed || !signerName.trim() || !hasSignature
                return (
                  <button
                    onClick={() => handleAction('sign')}
                    disabled={disabled}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem',
                      fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                      background: disabled ? '#2a2a2a' : 'linear-gradient(to right, #f59e0b, #d97706)',
                      color: disabled ? '#555' : '#0a0a0a',
                      border: 'none',
                    }}
                  >
                    {submitting ? '處理中...' : '✍️ 確認簽署'}
                  </button>
                )
              })()}
              <button
                onClick={() => handleAction('reject')}
                disabled={submitting}
                style={{
                  padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.875rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  background: 'transparent', color: '#f87171',
                  border: '1px solid rgba(248,113,113,0.3)',
                }}
              >
                拒絕
              </button>
            </div>

            <p style={{ color: '#444', fontSize: '0.7rem', textAlign: 'center', marginTop: '1rem', margin: '1rem 0 0' }}>
              簽署後將記錄您的 IP 位址及時間作為電子證明 · 此連結於 72 小時後失效
            </p>
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#333', fontSize: '0.7rem', marginTop: '2rem' }}>
          光合創學有限公司 © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
