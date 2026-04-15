'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: '#111', border: '1px solid #222' }}
      >
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-lg font-bold"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          !
        </div>
        <h2 className="text-lg font-bold text-white mb-2 font-display">載入此頁時發生錯誤</h2>
        <p className="text-sm mb-6" style={{ color: '#9a9a9a' }}>
          側欄和其他頁面仍可正常使用。
        </p>
        {error.digest && (
          <p className="text-xs mb-4 font-mono" style={{ color: '#555' }}>
            {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            重新嘗試
          </button>
          <a href="/" className="btn-secondary">
            回看板首頁
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs" style={{ color: '#666' }}>
              技術細節
            </summary>
            <pre
              className="mt-3 p-3 rounded-lg text-xs overflow-auto max-h-40 font-mono"
              style={{ background: '#0a0a0a', border: '1px solid #222', color: '#c8c4be' }}
            >
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
