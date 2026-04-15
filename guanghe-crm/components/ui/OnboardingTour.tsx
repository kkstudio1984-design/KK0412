'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Step {
  title: string
  description: string
  action?: { label: string; href: string }
  icon: string
}

const STEPS: Step[] = [
  {
    icon: '👋',
    title: '歡迎使用光合創學營運管理系統',
    description: '這是一套涵蓋 6 大模組的整合營運後台：客戶 CRM、專案、銷售、財務、培訓、AI 戰略。',
  },
  {
    icon: '⌘',
    title: '快速搜尋與導航',
    description: '按 ⌘K（Mac）/ Ctrl+K（PC）快速跳轉到任何客戶、專案或頁面。按 ? 查看所有快捷鍵。',
  },
  {
    icon: '⊞',
    title: 'CRM 看板',
    description: '左側選單「CRM 看板」是系統核心。七階段拖拉管理客戶，從初步詢問到已結案或已流失。',
    action: { label: '前往 CRM 看板', href: '/' },
  },
  {
    icon: '◈',
    title: '儀表板',
    description: '儀表板分三層：救火層（今天要爆的事）、生存層（錢夠不夠）、成長層（三個月後客戶在哪）。',
    action: { label: '前往儀表板', href: '/dashboard' },
  },
  {
    icon: '🎉',
    title: '準備好開始了！',
    description: '如有疑問，隨時按 ? 查看快捷鍵，或聯繫系統管理員。祝營運順利！',
  },
]

export default function OnboardingTour() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    // Only show to logged-in users on first visit
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('onboarding-completed')
    if (!seen) {
      const timer = setTimeout(() => setShow(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const finish = () => {
    localStorage.setItem('onboarding-completed', '1')
    setShow(false)
  }

  const skip = () => finish()

  if (!show) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="rounded-2xl max-w-md w-full overflow-hidden"
        style={{
          background: '#111',
          border: '1px solid #333',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 50px rgba(217,119,6,0.15)',
        }}
      >
        {/* Progress */}
        <div className="h-1 flex">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 transition-all"
              style={{
                background: i <= step ? '#d97706' : '#1a1a1a',
              }}
            />
          ))}
        </div>

        <div className="p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 0 30px rgba(217,119,6,0.4)',
            }}
          >
            {current.icon}
          </div>

          <h2 className="text-xl font-bold text-white font-display mb-3">{current.title}</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: '#c8c4be' }}>{current.description}</p>

          {current.action && (
            <Link
              href={current.action.href}
              onClick={finish}
              className="inline-block btn-primary mb-6"
            >
              {current.action.label} →
            </Link>
          )}

          <div className="flex items-center justify-between">
            <button onClick={skip} className="text-xs" style={{ color: '#666' }}>
              跳過導覽
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#666' }}>{step + 1} / {STEPS.length}</span>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: '#1a1a1a', color: '#888', border: '1px solid #2a2a2a' }}
                >
                  上一步
                </button>
              )}
              {!isLast ? (
                <button onClick={() => setStep(step + 1)} className="btn-primary text-xs px-4 py-1.5">
                  下一步 →
                </button>
              ) : (
                <button onClick={finish} className="btn-primary text-xs px-4 py-1.5">
                  開始使用 ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
