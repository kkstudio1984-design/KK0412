'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Lead } from '@/lib/types'
import { getFollowUpColor, getFollowUpDotColor, getFollowUpLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  lead: Lead
  index: number
}

export default function LeadCard({ lead, index }: Props) {
  const router = useRouter()
  const followUpColor = getFollowUpColor(lead.followUpDate)
  const followUpDot = getFollowUpDotColor(lead.followUpDate)

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.push(`/sales/leads/${lead.id}`)}
          className="rounded-xl p-4 cursor-pointer select-none group"
          style={{
            ...provided.draggableProps.style,
            background: '#0f0f0f',
            border: `1px solid ${snapshot.isDragging ? '#d97706' : '#1f1f1f'}`,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform ?? ''} rotate(1deg) scale(1.02)`
              : (provided.draggableProps.style?.transform ?? 'none'),
            boxShadow: snapshot.isDragging
              ? '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(217,119,6,0.2)'
              : '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {/* Contact name */}
          <p className="font-semibold text-sm leading-snug mb-1.5 line-clamp-1" style={{ color: '#e8e6e3' }}>
            {lead.contactName}
          </p>

          {/* Organization name */}
          {lead.organization && (
            <p className="text-xs mb-2.5 line-clamp-1" style={{ color: '#888' }}>
              {lead.organization.name}
            </p>
          )}

          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: '#1a1a1a', color: '#a8a29e' }}
            >
              {lead.channel}
            </span>
            <span
              className="inline-block text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: 'rgba(217,119,6,0.1)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              {lead.interest}
            </span>
          </div>

          {/* Follow-up */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${followUpDot}`} />
            <span className="text-xs" style={{ color: followUpColor }}>
              {getFollowUpLabel(lead.followUpDate)}
            </span>
          </div>

          {/* Converted badge */}
          {lead.convertedTo && (
            <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1f1f1f' }}>
              <span
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
              >
                ✓ 已轉換
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
