interface Props {
  icon: string
  message: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
}

export default function EmptyState({ icon, message, actionLabel, actionHref, onAction }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
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
