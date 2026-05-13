import StudentForm from '@/components/students/StudentForm'
import PageHeader from '@/components/ui/PageHeader'

export default function NewStudentPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <PageHeader
        title="新增學員"
        subtitle="身障 AI 就業 skill 計畫"
        breadcrumbs={[
          { label: '學員管理', href: '/students' },
          { label: '新增' },
        ]}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900">
        <p className="font-semibold mb-1">隱私守則</p>
        <p>
          這份表單只記錄基礎資料。公開授權（照片／姓名／故事）與工作成果授權須走獨立簽署流程，**不會**在這裡勾選。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <StudentForm />
      </div>
    </div>
  )
}
