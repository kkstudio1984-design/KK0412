'use client'

import { Draggable } from '@hello-pangea/dnd'
import { ClientWithOrg } from '@/lib/types'
import { formatNTD, getFollowUpColor, getFollowUpDotColor, getFollowUpLabel } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Props {
  client: ClientWithOrg
  index: number
}

export default function ClientCard({ client, index }: Props) {
  const router = useRouter()
  const hasRedFlags = client.redFlags.length > 0
  const followUpColor = getFollowUpColor(client.followUpDate)
  const followUpDot = getFollowUpDotColor(client.followUpDate)

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => router.push(`/clients/${client.id}`)}
          className={`bg-white border rounded-lg p-3 cursor-pointer select-none transition-shadow ${
            snapshot.isDragging
              ? 'shadow-lg border-blue-300 rotate-1'
              : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          {/* 紅旗 */}
          {hasRedFlags && (
            <div className="group relative mb-2">
              <div className="inline-flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded">
                <span>🚩</span>
                <span>紅旗</span>
              </div>
              <div className="absolute left-0 top-6 z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                {client.redFlags.join('、')}
              </div>
            </div>
          )}

          {/* 公司名稱 */}
          <p className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-1">
            {client.organization.name}
          </p>

          {/* 聯絡人 */}
          <p className="text-xs text-gray-500 mb-1">
            {client.organization.contactName}
          </p>

          {/* 服務類型 */}
          <span className="inline-block text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium mb-2">
            {client.serviceType}
          </span>

          {/* 跟進日期 */}
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${followUpDot}`} />
            <span className={`text-xs ${followUpColor}`}>
              {getFollowUpLabel(client.followUpDate)}
            </span>
          </div>

          {/* 月費 + 逾期標記 */}
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500">
              {formatNTD(client.monthlyFee)}<span className="text-gray-400">/月</span>
            </span>
            {client.hasOverduePayment && (
              <span className="text-xs text-red-600 font-medium">💰逾期</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
