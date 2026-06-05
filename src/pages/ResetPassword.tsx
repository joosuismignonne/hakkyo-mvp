import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Stage = 'waiting' | 'form' | 'success' | 'error'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [stage, setStage]       = useState<Stage>('waiting')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!supabase) { setStage('error'); setError('Supabase is not configured.'); return }

    // Supabase v2 detects the #access_token hash automatically and fires PASSWORD_RECOVERY.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('form')
    })

    // If the hash was already consumed before this component mounted (e.g. hot reload),
    // check for an existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStage('form')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }

    setSaving(true); setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setStage('success')
      setTimeout(() => navigate('/admin', { replace: true }), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Reset password</h1>
        <p className="text-sm text-gray-400 mb-8">HAKKYO · Admin</p>

        {stage === 'waiting' && (
          <p className="text-sm text-gray-400">Verifying reset link…</p>
        )}

        {stage === 'error' && (
          <p className="text-sm text-red-500">{error || 'Invalid or expired reset link.'}</p>
        )}

        {stage === 'success' && (
          <p className="text-sm text-gray-600">Password updated. Redirecting to admin…</p>
        )}

        {stage === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={saving} className="btn-yellow w-full">
              {saving ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
