'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  created_at: string
}

interface Props {
  initialUsers: Profile[]
  currentUserId: string
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  operator: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  viewer: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  partner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

const ROLE_LABELS: Record<string, string> = {
  admin: '管理員',
  operator: '行政人員',
  viewer: '股東',
  partner: '夥伴',
}

export default function UsersTable({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [updating, setUpdating] = useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId && newRole !== 'admin') {
      toast.error('不能將自己的管理員權限移除')
      return
    }
    setUpdating(userId)
    const prev = users
    setUsers(us => us.map(u => u.id === userId ? { ...u, role: newRole } : u))
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) throw new Error()
      toast.success(`角色已更新為「${ROLE_LABELS[newRole]}」`)
    } catch {
      toast.error('更新失敗')
      setUsers(prev)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#9a9a9a' }}>共 {users.length} 位使用者</p>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold px-4 py-3">姓名</th>
              <th className="text-left text-xs font-semibold px-4 py-3">Email</th>
              <th className="text-left text-xs font-semibold px-4 py-3">角色</th>
              <th className="text-left text-xs font-semibold px-4 py-3">註冊</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-white">
                  {u.name || '—'}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-amber-400">（你）</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: '#9a9a9a' }}>{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={updating === u.id}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className={`badge cursor-pointer border ${ROLE_STYLES[u.role] || ''}`}
                  >
                    <option value="admin">管理員</option>
                    <option value="operator">行政人員</option>
                    <option value="viewer">股東</option>
                    <option value="partner">夥伴</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#9a9a9a' }}>
                  {new Date(u.created_at).toLocaleDateString('zh-TW')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="text-sm font-semibold text-white mb-2">邀請新使用者</h3>
        <p className="text-xs mb-3" style={{ color: '#9a9a9a' }}>
          新使用者需先以 Google 帳號登入過系統，然後你就能在這裡看到他並指派角色。
        </p>
        <p className="text-xs" style={{ color: '#555' }}>
          請將系統網址分享給對方：<span className="font-mono text-amber-400">https://guanghe-crm.vercel.app</span>
        </p>
      </div>
    </div>
  )
}
