import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'forgot' | 'forgot-sent'

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase is not configured.')
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) throw resetError
      setMode('forgot-sent')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {mode === 'signin' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Admin sign in</h1>
            <p className="text-sm text-gray-400 mb-8">HAKKYO · restricted area</p>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" autoComplete="email"
                       value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" autoComplete="current-password"
                       value={password} onChange={e => setPassword(e.target.value)} required />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={loading} className="btn-yellow w-full">
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => { setMode('forgot'); setError('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Forgot password?
              </button>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Reset password</h1>
            <p className="text-sm text-gray-400 mb-8">Enter your email to receive a reset link.</p>

            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" autoComplete="email"
                       value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button type="submit" disabled={loading} className="btn-yellow w-full">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button onClick={() => { setMode('signin'); setError('') }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Back to sign in
              </button>
            </div>
          </>
        )}

        {mode === 'forgot-sent' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-1">Check your email</h1>
            <p className="text-sm text-gray-500 mb-8">
              A password reset link has been sent to <span className="font-medium text-gray-700">{email}</span>.
              Click the link in the email to set a new password.
            </p>
            <button onClick={() => setMode('signin')}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to sign in
            </button>
          </>
        )}

      </div>
    </div>
  )
}
