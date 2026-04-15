'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Fatal Error]', error)
  }, [error])

  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#e8e6e3', fontFamily: 'system-ui, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0a0a0a',
            boxShadow: '0 0 30px rgba(217, 119, 6, 0.3)',
          }}>!</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>
            嚴重錯誤
          </h1>
          <p style={{ fontSize: '14px', color: '#9a9a9a', marginBottom: '24px' }}>
            系統發生無法恢復的錯誤。請嘗試重新載入，如問題持續請聯絡管理員。
          </p>
          <button
            onClick={reset}
            style={{
              background: '#d97706', color: '#fff', fontSize: '14px', fontWeight: 600,
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              boxShadow: '0 0 16px rgba(217, 119, 6, 0.15)',
            }}
          >
            重新載入
          </button>
        </div>
      </body>
    </html>
  )
}
