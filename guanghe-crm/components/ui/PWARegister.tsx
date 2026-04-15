'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Capture install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)

      // Show banner if user hasn't dismissed it
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setShowBanner(false)
  }

  if (!showBanner || !installPrompt) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 rounded-xl p-4 shadow-2xl"
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(217,119,6,0.15)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0a0a0a',
            boxShadow: '0 0 16px rgba(217,119,6,0.3)',
          }}
        >
          光
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white mb-1">加到手機主畫面</p>
          <p className="text-xs mb-3" style={{ color: '#9a9a9a' }}>
            像 app 一樣開啟，離線也能查資料
          </p>
          <div className="flex gap-2">
            <button onClick={handleInstall} className="btn-primary text-xs px-3 py-1.5">
              安裝
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: '#666' }}
            >
              稍後
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
