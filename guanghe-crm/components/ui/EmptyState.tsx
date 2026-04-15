type IllustrationType = 'empty' | 'clients' | 'documents' | 'contracts' | 'payments' | 'sales' | 'projects' | 'training' | 'search'

interface Props {
  illustration?: IllustrationType
  icon?: string
  title?: string
  message: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

const Illustration = ({ type }: { type: IllustrationType }) => {
  const stroke = 'rgba(217, 119, 6, 0.4)'
  const fill = 'rgba(217, 119, 6, 0.08)'

  switch (type) {
    case 'clients':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="45" r="18" stroke={stroke} strokeWidth="2" fill={fill} />
          <path d="M30 100 C30 82 43 72 60 72 C77 72 90 82 90 100" stroke={stroke} strokeWidth="2" fill={fill} strokeLinecap="round" />
          <circle cx="30" cy="40" r="10" stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.5" />
          <circle cx="90" cy="40" r="10" stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>
      )
    case 'documents':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="30" y="20" width="60" height="80" rx="6" stroke={stroke} strokeWidth="2" fill={fill} />
          <line x1="42" y1="40" x2="78" y2="40" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="54" x2="72" y2="54" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="68" x2="78" y2="68" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="82" x2="66" y2="82" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'contracts':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="25" y="25" width="70" height="80" rx="4" stroke={stroke} strokeWidth="2" fill={fill} />
          <path d="M35 45 L55 45 M35 55 L75 55 M35 65 L75 65 M35 75 L65 75" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="80" cy="90" r="12" stroke={stroke} strokeWidth="2" fill="rgba(217,119,6,0.12)" />
          <path d="M75 90 L79 94 L85 86" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'payments':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="20" y="35" width="80" height="50" rx="6" stroke={stroke} strokeWidth="2" fill={fill} />
          <line x1="20" y1="50" x2="100" y2="50" stroke={stroke} strokeWidth="2" />
          <rect x="32" y="62" width="16" height="12" rx="2" stroke={stroke} strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1="55" y1="70" x2="85" y2="70" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'sales':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M20 90 L40 70 L60 80 L80 50 L100 30" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="40" cy="70" r="4" fill={stroke} />
          <circle cx="60" cy="80" r="4" fill={stroke} />
          <circle cx="80" cy="50" r="4" fill={stroke} />
          <circle cx="100" cy="30" r="5" fill="rgba(217,119,6,0.6)" />
          <path d="M95 30 L100 25 L105 30" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'projects':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="20" y="30" width="25" height="55" rx="3" stroke={stroke} strokeWidth="2" fill={fill} />
          <rect x="50" y="45" width="25" height="40" rx="3" stroke={stroke} strokeWidth="2" fill={fill} />
          <rect x="80" y="25" width="25" height="60" rx="3" stroke={stroke} strokeWidth="2" fill={fill} />
          <line x1="15" y1="90" x2="105" y2="90" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'training':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M60 30 L25 50 L60 70 L95 50 Z" stroke={stroke} strokeWidth="2" fill={fill} strokeLinejoin="round" />
          <path d="M40 60 L40 80 C40 80 48 90 60 90 C72 90 80 80 80 80 L80 60" stroke={stroke} strokeWidth="2" fill="none" strokeLinecap="round" />
          <line x1="95" y1="50" x2="95" y2="75" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'search':
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="50" cy="50" r="25" stroke={stroke} strokeWidth="2" fill={fill} />
          <line x1="70" y1="70" x2="90" y2="90" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="30" y="30" width="60" height="60" rx="8" stroke={stroke} strokeWidth="2" strokeDasharray="4 4" fill={fill} />
          <circle cx="60" cy="60" r="4" fill={stroke} />
        </svg>
      )
  }
}

export default function EmptyState({ illustration, icon, title, message, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="empty-state">
      {illustration ? (
        <div className="mb-4 opacity-80">
          <Illustration type={illustration} />
        </div>
      ) : icon ? (
        <span className="empty-state-icon">{icon}</span>
      ) : null}
      {title && <p className="text-base font-semibold text-white mb-2 font-display">{title}</p>}
      <p className="empty-state-text">{message}</p>
      {actionLabel && (
        actionHref ? (
          <a href={actionHref} className="btn-primary text-xs px-3 py-1.5">{actionLabel}</a>
        ) : onAction ? (
          <button onClick={onAction} className="btn-primary text-xs px-3 py-1.5">{actionLabel}</button>
        ) : null
      )}
    </div>
  )
}
