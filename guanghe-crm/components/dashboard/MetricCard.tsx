interface Props {
  title: string
  value: string
  sub?: string
  subColor?: 'red' | 'gray'
}

export default function MetricCard({ title, value, sub, subColor = 'gray' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${subColor === 'red' ? 'text-red-500' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}
