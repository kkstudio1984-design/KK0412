export const dynamic = 'force-dynamic'
import { fetchCourses } from '@/lib/queries'
import CourseList from '@/components/training/CourseList'
import PageHeader from '@/components/ui/PageHeader'

export default async function TrainingPage() {
  const courses = await fetchCourses()
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="教育訓練"
        subtitle="同理心體驗・企業培訓・AI工具工作坊・夥伴內訓"
        moduleColor="bg-pink-500"
      />
      <CourseList initialCourses={courses} />
    </div>
  )
}
