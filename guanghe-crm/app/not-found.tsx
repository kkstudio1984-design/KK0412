import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <p
          className="text-6xl font-bold mb-4 font-display"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(217, 119, 6, 0.3)',
          }}
        >
          404
        </p>
        <h1 className="text-lg font-bold text-white mb-2">找不到這個頁面</h1>
        <p className="text-sm mb-6" style={{ color: '#9a9a9a' }}>
          你要找的頁面不存在，可能是連結錯誤或已被移除。
        </p>
        <Link href="/" className="btn-primary inline-block">
          回看板首頁
        </Link>
      </div>
    </div>
  )
}
