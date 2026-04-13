export const dynamic = 'force-dynamic'
import { fetchCourses } from '@/lib/queries'
import CourseList from '@/components/training/CourseList'

export default async function TrainingPage() {
  const courses = await fetchCourses()
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-stone-800">教育訓練</h1>
        <p className="text-xs text-stone-400 mt-0.5">同理心體驗・企業培訓・AI工具工作坊・夥伴內訓</p>
      </div>
      <CourseList initialCourses={courses} />
    </div>
  )
}
