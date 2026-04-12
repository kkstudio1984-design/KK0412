interface Props {
  title: string
  value: string
  sub?: string
  subColor?: 'red' | 'gray'
}

export default function MetricCard({ title, value, sub, subColor = 'gray' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {sub && (
        <p className={`text-xs mt-1.5 font-medium ${subColor === 'red' ? 'text-red-500' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  )
}
