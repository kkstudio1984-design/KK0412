'use client'

import { useState } from 'react'

interface Props {
  text: string
  disabled?: boolean
}

export default function CopyAllButton({ text, disabled }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (disabled || !text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback：選取 textarea
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
        disabled
          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
          : copied
          ? 'bg-green-100 text-green-700'
          : 'bg-stone-900 text-white hover:bg-stone-700'
      }`}
    >
      {copied ? '✓ 已複製' : '📋 全部複製'}
    </button>
  )
}
