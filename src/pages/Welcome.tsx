import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Welcome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    // 이미 닉네임 있으면 스킵
    supabase?.from('profiles').select('nickname').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) navigate('/community/general', { replace: true })
    })
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nickname.trim()) { setError('닉네임을 입력해 주세요.'); return }
    if (nickname.trim().length < 2) { setError('닉네임은 2자 이상이어야 해요.'); return }
    if (!user || !supabase) return
    setSaving(true); setError('')
    const { error: err } = await supabase.from('profiles').upsert({ id: user.id, nickname: nickname.trim() })
    if (err) { setError('저장 중 오류가 발생했어요.'); setSaving(false); return }
    navigate('/community/general', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f9f9f7' }}>
      <div className="w-full max-w-sm">
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5, marginBottom: 4 }}>HAKKYO</div>
        <div style={{ height: 3, width: 36, background: '#f5c542', borderRadius: 2, marginBottom: 32 }} />

        <h1 className="text-2xl font-bold mb-1">환영해요! 🎉</h1>
        <p className="text-sm text-gray-400 mb-2">Bienvenue · Welcome</p>
        <p className="text-sm text-gray-500 mb-8">커뮤니티에서 사용할 닉네임을 설정해 주세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">닉네임 · Pseudo</label>
            <input
              type="text"
              className="input w-full"
              placeholder="예: 민준, Sophie, Alex…"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">{nickname.trim().length}/20</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={saving} className="btn-yellow w-full">
            {saving ? '저장 중…' : '커뮤니티 시작하기 →'}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center">
          {user?.email} · 닉네임은 나중에 변경할 수 있어요.
        </p>
      </div>
    </div>
  )
}
