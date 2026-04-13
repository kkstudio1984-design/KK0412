import { BoardSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="animate-pulse space-y-1">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <BoardSkeleton />
      </div>
    </div>
  )
}
