import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Stage = 'waiting' | 'form' | 'success' | 'error'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [stage, setStage]       = useState<Stage>('waiting')
  const [isInvite, setIsInvite] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!supabase) { setStage('error'); setError('Supabase is not configured.'); return }

    const hash = window.location.hash
    const isInviteLink = hash.includes('type=invite') || hash.includes('type=signup')
    if (isInviteLink) setIsInvite(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setStage('form')
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStage('form')
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    if (password !== confirm) { setError('비밀번호가 일치하지 않아요.'); return }
    if (password.length < 6)  { setError('비밀번호는 6자 이상이어야 해요.'); return }

    setSaving(true); setError('')
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setStage('success')
      setTimeout(() => navigate('/', { replace: true }), 2000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했어요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {isInvite ? 'HAKKYO 커뮤니티에 오신 걸 환영해요' : '비밀번호 재설정'}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {isInvite ? '사용할 비밀번호를 설정해 주세요.' : 'HAKKYO'}
        </p>

        {stage === 'waiting' && (
          <p className="text-sm text-gray-400">링크를 확인하는 중…</p>
        )}

        {stage === 'error' && (
          <p className="text-sm text-red-500">{error || '유효하지 않거나 만료된 링크예요.'}</p>
        )}

        {stage === 'success' && (
          <p className="text-sm text-gray-600">
            {isInvite ? '가입 완료! 잠시 후 홈으로 이동해요.' : '비밀번호가 변경됐어요.'}
          </p>
        )}

        {stage === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{isInvite ? '비밀번호 설정' : '새 비밀번호'}</label>
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
              <label className="label">비밀번호 확인</label>
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
              {saving ? '저장 중…' : isInvite ? '가입 완료하기' : '비밀번호 변경'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
