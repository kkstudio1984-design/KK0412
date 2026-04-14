'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channels = tables.map((table) =>
      supabase
        .channel(`refresh_${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            router.refresh()
          }
        )
        .subscribe()
    )

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch))
    }
  }, [tables, router])
}
