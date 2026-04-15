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
    console.error('[Global Error]', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-2xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0a0a0a',
            boxShadow: '0 0 30px rgba(217, 119, 6, 0.3)',
          }}
        >
          !
        </div>
        <h1 className="text-2xl font-bold text-white mb-3 font-display">系統發生錯誤</h1>
        <p className="text-sm mb-2" style={{ color: '#9a9a9a' }}>
          很抱歉，頁面載入時出了點問題。
        </p>
        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: '#555' }}>
            錯誤碼：{error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            重新載入
          </button>
          <a href="/" className="btn-secondary">
            回首頁
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-xs" style={{ color: '#666' }}>
              技術細節（僅開發環境顯示）
            </summary>
            <pre
              className="mt-3 p-4 rounded-lg text-xs overflow-auto max-h-48 font-mono"
              style={{ background: '#111', border: '1px solid #222', color: '#c8c4be' }}
            >
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
