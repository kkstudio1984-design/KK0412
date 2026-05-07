import type { HealthScore } from '@/lib/health-score'

interface Props {
  health: HealthScore
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

export default function HealthCard({ health }: Props) {
  const bg = LEVEL_BG[health.level] || LEVEL_BG.closed
  const text = LEVEL_TEXT[health.level] || LEVEL_TEXT.closed

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

      {health.factors.length > 0 && (
        <div className="border-t border-current/10 pt-3">
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
