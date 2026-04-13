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
          className={`bg-white border rounded-xl p-4 cursor-pointer select-none group ${
            snapshot.isDragging
              ? 'shadow-2xl border-amber-400 rotate-1 scale-[1.02]'
              : 'border-stone-200/80 hover:border-amber-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          }`}
        >
          {/* Contact name */}
          <p className="font-semibold text-stone-800 text-sm leading-snug mb-1.5 line-clamp-1 group-hover:text-amber-700">
            {lead.contactName}
          </p>

          {/* Organization name */}
          {lead.organization && (
            <p className="text-xs text-stone-400 mb-2.5 line-clamp-1">
              {lead.organization.name}
            </p>
          )}

          {/* Pills row */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            {/* Channel pill */}
            <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 font-medium">
              {lead.channel}
            </span>
            {/* Interest pill */}
            <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-100">
              {lead.interest}
            </span>
          </div>

          {/* Follow-up */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${followUpDot}`} />
            <span className={`text-xs ${followUpColor}`}>
              {getFollowUpLabel(lead.followUpDate)}
            </span>
          </div>

          {/* Converted badge */}
          {lead.convertedTo && (
            <div className="mt-2 pt-2 border-t border-stone-100">
              <span className="badge text-emerald-700 bg-emerald-50 border-emerald-200 text-xs px-2 py-0.5 rounded-md font-medium">
                已轉換
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
