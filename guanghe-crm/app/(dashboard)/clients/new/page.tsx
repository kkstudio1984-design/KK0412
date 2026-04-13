import ClientForm from '@/components/clients/ClientForm'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">新增客戶</h1>
        <p className="text-sm text-gray-400 mt-1">填寫組織資料與服務內容，完成後自動進入「初步詢問」階段</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <ClientForm />
      </div>
    </div>
  )
}
