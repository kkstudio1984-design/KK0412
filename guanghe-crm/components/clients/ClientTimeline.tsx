import { formatDate } from '@/lib/utils'

interface TimelineEvent {
  id: string
  type: 'created' | 'stage' | 'kyc' | 'document' | 'contract' | 'payment' | 'mail' | 'offboarding'
  title: string
  description?: string
  date: string
  color: string
}

interface Props {
  events: TimelineEvent[]
}

const TYPE_ICON: Record<string, string> = {
  created: '✦',
  stage: '→',
  kyc: '✓',
  document: '📄',
  contract: '📜',
  payment: '$',
  mail: '✉',
  offboarding: '⚠',
}

export default function ClientTimeline({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="card p-6">
        <p className="section-title mb-3">互動時間軸</p>
        <p className="text-sm text-center py-8" style={{ color: '#666' }}>尚無活動紀錄</p>
      </div>
    )
  }

  // Sort by date desc
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="card p-6">
      <p className="section-title mb-4">互動時間軸</p>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px" style={{ background: '#2a2a2a' }} />

        <div className="space-y-4">
          {sorted.map((event) => (
            <div key={event.id} className="relative pl-7">
              {/* Dot */}
              <div
                className="absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: event.color,
                  color: '#0a0a0a',
                  boxShadow: `0 0 12px ${event.color}60`,
                }}
              >
                {TYPE_ICON[event.type] || '•'}
              </div>

              {/* Content */}
              <div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">{event.title}</p>
                  <p className="text-xs" style={{ color: '#666' }}>{formatDate(event.date)}</p>
                </div>
                {event.description && (
                  <p className="text-xs mt-0.5" style={{ color: '#9a9a9a' }}>{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
