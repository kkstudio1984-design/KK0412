export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/ui/PageHeader'
import UsersTable from '@/components/admin/UsersTable'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <PageHeader
        title="使用者管理"
        subtitle="管理角色與權限（僅 admin 可見）"
        moduleColor="bg-amber-500"
      />
      <UsersTable initialUsers={users || []} currentUserId={user.id} />
    </div>
  )
}
