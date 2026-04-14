'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeRefresh(tables: string[]) {
  const router = useRouter()
  const tablesRef = useRef(tables)

  useEffect(() => {
    try {
      const supabase = createClient()
      const channels = tablesRef.current.map((table) =>
        supabase
          .channel(`refresh_${table}_${Date.now()}`)
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
        channels.forEach((ch) => {
          try { supabase.removeChannel(ch) } catch {}
        })
      }
    } catch {
      // Silently fail if realtime is not available
    }
  }, [router])
}
