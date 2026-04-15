'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white"
    >
      🖨 列印 / 存 PDF
    </button>
  )
}
