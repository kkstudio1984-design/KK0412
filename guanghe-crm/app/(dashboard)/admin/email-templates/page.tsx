export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import EmailTemplateList from '@/components/admin/EmailTemplateList'

export default async function EmailTemplatesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Email 範本"
        subtitle="系統通知與催款信件範本管理"
        moduleColor="bg-amber-500"
      />
      <EmailTemplateList initialTemplates={templates || []} />
    </div>
  )
}
