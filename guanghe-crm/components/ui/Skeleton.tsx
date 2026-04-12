// 基礎 skeleton 方塊
export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

// 看板頁 skeleton — 7 欄
export function BoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-2 px-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="w-60 shrink-0 bg-gray-50 rounded-lg border-t-4 border-t-gray-200 p-3 space-y-2">
          <div className="flex justify-between mb-3">
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-4 w-6 rounded-full" />
          </div>
          {Array.from({ length: i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0 }).map((_, j) => (
            <div key={j} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
              <SkeletonBox className="h-3.5 w-3/4" />
              <SkeletonBox className="h-3 w-1/2" />
              <SkeletonBox className="h-3 w-1/3" />
              <SkeletonBox className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// 詳情頁 skeleton
export function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBox className="h-4 w-12" />
        <SkeletonBox className="h-4 w-4" />
        <SkeletonBox className="h-5 w-48" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <SkeletonBox className="h-5 w-24 mb-2" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={i < 2 ? 'col-span-2' : ''}>
              <SkeletonBox className="h-3 w-16 mb-1.5" />
              <SkeletonBox className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <SkeletonBox className="h-5 w-24 mb-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

// 儀表板 skeleton
export function DashboardSkeleton() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <SkeletonBox className="h-6 w-24 mb-1" />
        <SkeletonBox className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <SkeletonBox className="h-3 w-20 mb-3" />
            <SkeletonBox className="h-8 w-28 mb-2" />
            <SkeletonBox className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SkeletonBox className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <SkeletonBox className="h-4 w-40" />
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="h-4 w-16" />
              <SkeletonBox className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
