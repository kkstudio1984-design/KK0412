import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

interface Props {
  title: string
  subtitle?: string
  moduleColor?: string // tailwind color class like 'bg-amber-500'
  breadcrumbs?: Breadcrumb[]
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, moduleColor, breadcrumbs, action }: Props) {
  return (
    <div className="page-header">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-2 text-xs">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-stone-300">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="text-stone-400 hover:text-stone-600">{crumb.label}</Link>
              ) : (
                <span className="text-stone-400">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {moduleColor && <div className={`module-stripe ${moduleColor}`} />}
          <div>
            <h1 className="text-lg font-bold text-stone-800 font-display">{title}</h1>
            {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}
