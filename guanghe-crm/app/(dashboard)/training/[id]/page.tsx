export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { fetchCourse } from '@/lib/queries'
import { formatDate, formatNTD } from '@/lib/utils'
import SessionList from '@/components/training/SessionList'

const TYPE_STYLES: Record<string, string> = {
  '同理心體驗': 'text-pink-700 bg-pink-50 border-pink-200',
  '企業培訓': 'text-blue-700 bg-blue-50 border-blue-200',
  'AI工具工作坊': 'text-purple-700 bg-purple-50 border-purple-200',
  '夥伴內訓': 'text-amber-700 bg-amber-50 border-amber-200',
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await fetchCourse(id)
  if (!course) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <a href="/training" className="text-stone-400 hover:text-stone-600 text-sm">&larr; 教育訓練</a>
        <span className="text-stone-300">/</span>
        <h1 className="text-lg font-bold text-stone-800 truncate">{course.name}</h1>
        <span className={`badge shrink-0 ${TYPE_STYLES[course.courseType] || ''}`}>{course.courseType}</span>
      </div>

      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-stone-800 mb-4">課程資訊</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-xs text-stone-400 block mb-0.5">時數</span><span className="text-stone-700">{course.durationHours} 小時</span></div>
          <div><span className="text-xs text-stone-400 block mb-0.5">定價</span><span className="text-stone-700">{formatNTD(course.price)}</span></div>
          <div><span className="text-xs text-stone-400 block mb-0.5">人數上限</span><span className="text-stone-700">{course.maxParticipants} 人</span></div>
          <div><span className="text-xs text-stone-400 block mb-0.5">場次數</span><span className="text-stone-700">{(course.sessions || []).length} 場</span></div>
          {course.description && (
            <div className="col-span-2"><span className="text-xs text-stone-400 block mb-0.5">說明</span><span className="text-stone-700">{course.description}</span></div>
          )}
        </div>
      </div>

      <SessionList courseId={course.id} courseName={course.name} maxParticipants={course.maxParticipants} initialSessions={course.sessions || []} />
    </div>
  )
}
