interface Props {
  title: string
  value: string
  sub?: string
  subColor?: 'red' | 'green' | 'gray'
}

export default function MetricCard({ title, value, sub, subColor = 'gray' }: Props) {
  const subColors = {
    red: 'text-red-500',
    green: 'text-emerald-500',
    gray: 'text-stone-400',
  }

  return (
    <div className="card p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 to-amber-500" />
      <p className="section-title mb-2">{title}</p>
      <p className="text-2xl font-bold text-stone-800 tracking-tight tabular-nums">{value}</p>
      {sub && (
        <p className={`text-xs mt-1.5 font-medium ${subColors[subColor]}`}>
          {sub}
        </p>
      )}
    </div>
  )
}
