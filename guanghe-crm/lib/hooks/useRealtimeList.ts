'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeList<T>(
  table: string,
  initialData: T[],
  mapFn?: (row: any) => T
) {
  const [data, setData] = useState<T[]>(initialData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`${table}_changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const map = mapFn || ((r: any) => r as T)

          if (payload.eventType === 'INSERT') {
            setData((prev) => [...prev, map(payload.new)])
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item: any) =>
                item.id === (payload.new as any).id ? map(payload.new) : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setData((prev) =>
              prev.filter((item: any) => item.id !== (payload.old as any).id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, mapFn])

  return [data, setData] as const
}
