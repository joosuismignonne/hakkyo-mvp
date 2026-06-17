import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Account() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()

  if (loading) return null

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-5"
          style={{ background: 'var(--y)', color: '#111' }}
        >
          {user.email?.[0]?.toUpperCase() ?? '?'}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">My account</h1>
        <p className="text-sm text-gray-500 mb-8 break-all">{user.email}</p>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full border border-gray-200 rounded-xl py-2.5 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
