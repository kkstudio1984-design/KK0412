import Link from 'next/link'
import KanbanBoard from '@/components/board/KanbanBoard'
import { fetchClients } from '@/lib/queries'

export default async function BoardPage() {
  const clients = await fetchClients()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-gray-900">CRM 看板</h1>
          <p className="text-xs text-gray-400 mt-0.5">共 {clients.length} 筆客戶</p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span>
          新增客戶
        </Link>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <KanbanBoard initialClients={clients} />
      </div>
    </div>
  )
}
