import type { HealthScore } from '@/lib/health-score'
import LogContactButton from './LogContactButton'

interface Props {
  health: HealthScore
  clientId: string
  lastContactedAt?: string | null
  lastContactedNote?: string | null
}

const LEVEL_BG: Record<string, string> = {
  healthy:   'bg-green-50 border-green-200',
  attention: 'bg-amber-50 border-amber-200',
  risk:      'bg-red-50 border-red-200',
  closed:    'bg-gray-50 border-gray-200',
}

const LEVEL_TEXT: Record<string, string> = {
  healthy:   'text-green-700',
  attention: 'text-amber-700',
  risk:      'text-red-700',
  closed:    'text-gray-500',
}

function daysAgoLabel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 週前`
  return `${Math.floor(days / 30)} 個月前`
}

export default function HealthCard({ health, clientId, lastContactedAt, lastContactedNote }: Props) {
  const bg = LEVEL_BG[health.level] || LEVEL_BG.closed
  const text = LEVEL_TEXT[health.level] || LEVEL_TEXT.closed

  const recentlyContacted = lastContactedAt
    ? (Date.now() - new Date(lastContactedAt).getTime()) < 7 * 86_400_000
    : false

  return (
    <section className={`rounded-xl border p-5 ${bg}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-xs font-bold uppercase tracking-widest ${text}`}>客戶健康度</h2>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 ${text} border border-current`}>
            {health.levelLabel}
          </span>
          <span className={`text-2xl font-bold tabular-nums ${text}`}>{health.score}</span>
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-3">{health.suggestion}</p>

      {/* 上次聯繫資訊 */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-current/10 mb-3">
        <div className="flex-1 min-w-0">
          {lastContactedAt ? (
            <>
              <p className="text-xs text-gray-500">
                上次聯繫：<span className={`font-medium ${recentlyContacted ? 'text-green-700' : 'text-gray-700'}`}>{daysAgoLabel(lastContactedAt)}</span>
                {recentlyContacted && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">7 天內已聯繫</span>}
              </p>
              {lastContactedNote && (
                <p className="text-xs text-gray-500 mt-1 truncate" title={lastContactedNote}>
                  「{lastContactedNote}」
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">尚未紀錄主動聯繫</p>
          )}
        </div>
        {health.level !== 'closed' && (
          <LogContactButton clientId={clientId} />
        )}
      </div>

      {health.factors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">扣分明細</p>
          <ul className="space-y-1.5">
            {health.factors.map((f, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{f.label}</span>
                <span className={`font-semibold tabular-nums ${f.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {f.delta > 0 ? '+' : ''}{f.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
