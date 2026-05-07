'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Props {
  /** Optional filename hint, e.g. "合約-GH-ABC12345" — defaults to current document title */
  filename?: string
  /** CSS selector for the printable content area (defaults to first .max-w-3xl in document) */
  targetSelector?: string
}

export default function PrintButton({ filename, targetSelector = '[data-pdf-target]' }: Props) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const target = document.querySelector(targetSelector) as HTMLElement | null
        || document.querySelector('.max-w-3xl') as HTMLElement | null
      if (!target) {
        toast.error('找不到列印內容區')
        return
      }

      // Dynamic import keeps initial bundle slim — these libs are only needed on click.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])

      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      // A4 = 210 x 297 mm. Fit width, paginate vertically if content overflows.
      const pageWidth = 210
      const pageHeight = 297
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const safeName = (filename || document.title || '合約').replace(/[\\/:*?"<>|]/g, '_')
      pdf.save(`${safeName}.pdf`)
      toast.success('PDF 已下載')
    } catch (e) {
      toast.error('下載失敗，請改用列印 → 另存 PDF')
      console.error('PDF download error:', e)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {downloading ? '產生中...' : '⬇ 下載 PDF'}
      </button>
      <button
        onClick={() => window.print()}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-stone-200 hover:bg-stone-300 text-stone-700"
      >
        🖨 列印
      </button>
    </div>
  )
}
