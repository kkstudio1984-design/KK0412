export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import EmailTemplateEditor from '@/components/admin/EmailTemplateEditor'

export default async function EmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: template } = await supabase.from('email_templates').select('*').eq('id', id).single()
  if (!template) notFound()

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title={(template as { name: string }).name}
        subtitle="編輯範本內容"
        moduleColor="bg-amber-500"
        breadcrumbs={[{ label: 'Email 範本', href: '/admin/email-templates' }]}
      />
      <EmailTemplateEditor template={template as any} />
    </div>
  )
}
