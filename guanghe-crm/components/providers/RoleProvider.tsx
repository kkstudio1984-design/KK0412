'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Role = 'admin' | 'operator' | 'viewer' | 'partner' | null

interface RoleContextValue {
  role: Role
  canEdit: boolean
  isAdmin: boolean
  loading: boolean
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  canEdit: false,
  isAdmin: false,
  loading: true,
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoading(false)
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile) setRole(profile.role as Role)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const canEdit = role === 'admin' || role === 'operator'
  const isAdmin = role === 'admin'

  return (
    <RoleContext.Provider value={{ role, canEdit, isAdmin, loading }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}

/**
 * Wrapper component: only renders children if user can edit (admin or operator).
 * viewer sees nothing.
 */
export function CanEdit({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { canEdit } = useRole()
  if (!canEdit) return <>{fallback ?? null}</>
  return <>{children}</>
}

/**
 * Wrapper: only renders for admin.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useRole()
  if (!isAdmin) return null
  return <>{children}</>
}

/**
 * Shows a read-only badge banner for viewers.
 */
export function ViewerBanner() {
  const { role, loading } = useRole()
  if (loading || role !== 'viewer') return null

  return (
    <div
      className="mx-6 mt-4 px-4 py-2.5 rounded-lg flex items-center gap-2 text-xs"
      style={{
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        color: '#c4b5fd',
      }}
    >
      <span>👁</span>
      <span>您以<strong>唯讀模式</strong>瀏覽系統，無法新增或編輯資料。</span>
    </div>
  )
}
