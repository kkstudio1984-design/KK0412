// Base skeleton block
export function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: '#1a1a1a' }}
    />
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="page-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <SkeletonBox className="w-1 h-6 rounded-full mr-3" />
          <div>
            <SkeletonBox className="h-5 w-32 mb-2" />
            <SkeletonBox className="h-3 w-48" />
          </div>
        </div>
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  )
}

// Kanban board skeleton — 7 columns
export function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-8 pb-4">
        <PageHeaderSkeleton />
      </div>
      <div className="flex-1 overflow-x-auto px-4 py-4">
        <div className="flex gap-3 pb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-56 md:w-64 shrink-0 rounded-xl p-3 space-y-2.5"
              style={{ background: '#111', border: '1px solid #222', borderTop: '3px solid #222' }}
            >
              <div className="flex justify-between mb-3">
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-5 w-6 rounded-full" />
              </div>
              {Array.from({ length: i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0 }).map((_, j) => (
                <div key={j} className="rounded-lg p-4 space-y-2" style={{ background: '#0f0f0f', border: '1px solid #1f1f1f' }}>
                  <SkeletonBox className="h-3.5 w-3/4" />
                  <SkeletonBox className="h-3 w-1/2" />
                  <SkeletonBox className="h-5 w-20 rounded-md" />
                  <SkeletonBox className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Detail page skeleton (client/lead/project)
export function DetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBox className="h-4 w-12" />
        <SkeletonBox className="h-4 w-4" />
        <SkeletonBox className="h-5 w-48" />
        <SkeletonBox className="h-5 w-16 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <SkeletonBox className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j}>
                <SkeletonBox className="h-3 w-16 mb-1.5" />
                <SkeletonBox className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      <PageHeaderSkeleton />
      {/* Tier 1 */}
      <section>
        <SkeletonBox className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </section>
      {/* Tier 2 */}
      <section>
        <SkeletonBox className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-2">
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-8 w-32" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Table/list page skeleton (finance, training, ai-strategy)
export function ListSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <div className="flex items-center justify-between mb-4 mt-6">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>
      <div className="card overflow-hidden">
        <div className="border-b border-[#222] px-4 py-3 flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBox key={i} className="h-3 w-20" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-[#1a1a1a] px-4 py-3 flex gap-4 items-center">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-5 w-16 rounded-md" />
            <SkeletonBox className="h-4 w-20 ml-auto" />
            <SkeletonBox className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Card grid skeleton (projects, courses)
export function CardGridSkeleton() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeaderSkeleton />
      <div className="flex items-center justify-between mb-4 mt-6">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-4 w-40" />
              <div className="flex gap-2">
                <SkeletonBox className="h-5 w-16 rounded-md" />
                <SkeletonBox className="h-5 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex gap-4">
              <SkeletonBox className="h-3 w-24" />
              <SkeletonBox className="h-3 w-20" />
              <SkeletonBox className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
