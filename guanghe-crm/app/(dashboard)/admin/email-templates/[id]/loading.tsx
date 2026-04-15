import { DashboardSkeleton } from '@/components/ui/Skeleton'

export default function Loading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <DashboardSkeleton />
    </div>
  )
}
