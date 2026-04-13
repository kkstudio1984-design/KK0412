'use client'

import { Draggable } from '@hello-pangea/dnd'
import { ClientWithOrg } from '@/lib/types'
import { formatNTD, getFollowUpColor, getFollowUpDotColor, getFollowUpLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  client: ClientWithOrg
  index: number
}

function isAutoLossSuggestion(client: ClientWithOrg): boolean {
  const earlyStages = ['初步詢問', 'KYC審核中']
  if (!earlyStages.includes(client.stage)) return false
  if (!client.followUpDate) return false
  const followUp = new Date(client.followUpDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - followUp.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays > 14
}

export default function ClientCard({ client, index }: Props) {
  const router = useRouter()
  const hasRedFlags = client.redFlags.length > 0
  const followUpColor = getFollowUpColor(client.followUpDate)
  const followUpDot = getFollowUpDotColor(client.followUpDate)
  const showHighRiskKyc = client.isHighRiskKyc || client.blacklistFlag
  const showAutoLoss = isAutoLossSuggestion(client)
  const hasBadges = hasRedFlags || showHighRiskKyc

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.push(`/clients/${client.id}`)}
          className={`bg-white border rounded-xl p-4 cursor-pointer select-none group ${
            snapshot.isDragging
              ? 'shadow-2xl border-amber-400 rotate-1 scale-[1.02]'
              : 'border-stone-200/80 hover:border-amber-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          }`}
        >
          {/* Badges row */}
          {hasBadges && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {hasRedFlags && (
                <div className="group/flag relative">
                  <span className="badge text-red-600 bg-red-50 border-red-100">
                    🚩 紅旗
                  </span>
                  <div className="absolute left-0 top-7 z-10 hidden group-hover/flag:block bg-slate-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                    {client.redFlags.join('、')}
                  </div>
                </div>
              )}
              {showHighRiskKyc && (
                <span className="badge text-orange-700 bg-orange-50 border-orange-200">
                  ⚠ 高風險
                </span>
              )}
            </div>
          )}

          {/* Company name */}
          <p className="font-semibold text-stone-800 text-sm leading-snug mb-0.5 line-clamp-1 group-hover:text-amber-700">
            {client.organization.name}
          </p>

          {/* Contact */}
          <p className="text-xs text-stone-400 mb-3">
            {client.organization.contactName}
          </p>

          {/* Service type pill */}
          <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-500 font-medium mb-3">
            {client.serviceType}
          </span>

          {/* Follow-up */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${followUpDot}`} />
            <span className={`text-xs ${followUpColor}`}>
              {getFollowUpLabel(client.followUpDate)}
            </span>
          </div>

          {/* Auto-loss suggestion */}
          {showAutoLoss && (
            <div className="mb-1">
              <span className="text-xs text-stone-400 italic bg-stone-50 px-1.5 py-0.5 rounded">建議標記流失</span>
            </div>
          )}

          {/* Footer: price + overdue */}
          <div className="flex items-center justify-between mt-2 pt-2.5 border-t border-stone-100">
            <span className="text-xs font-semibold text-stone-600 tabular-nums">
              {formatNTD(client.monthlyFee)}<span className="text-stone-300 font-normal">/月</span>
            </span>
            {client.hasOverduePayment && (
              <span className="badge text-red-600 bg-red-50 border-red-100">逾期</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
