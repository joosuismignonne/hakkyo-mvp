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
    supabase?.from('profiles').select('nickname').eq('id', user.id).single().then(({ data }) => {
      if (data?.nickname) navigate('/community/chat', { replace: true })
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
    navigate('/community/chat', { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0e0e12', color: '#fff', fontFamily: 'inherit' }}>
      {/* Left panel */}
      <div style={{ width: 420, padding: '56px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid #1e1e24' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginBottom: 48, color: '#fff' }}>HAKKYO</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#f5c542', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Bienvenue · Welcome · 환영해요</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: '#fff' }}>
            몬트리올에서의<br />새로운 시작 🎉
          </h1>
          <p style={{ fontSize: 15, color: '#888', lineHeight: 1.8, marginBottom: 12 }}>
            Vous faites maintenant partie de la communauté HAKKYO à Montréal.
          </p>
          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8 }}>
            HAKKYO 커뮤니티 멤버가 되셨습니다.<br />
            프로그램, 액티비티, 커뮤니티 채널을 자유롭게 이용하세요.
          </p>
        </div>

        <div style={{ fontSize: 12, color: '#444' }}>
          {user?.email}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 64px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Step 1 of 1</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>닉네임을 설정해 주세요</h2>
            <p style={{ fontSize: 14, color: '#666' }}>커뮤니티에서 표시될 이름이에요. 나중에 변경할 수 있어요.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 24 }}>
              <input
                type="text"
                placeholder="예: 민준, Sophie, Alex…"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                autoFocus
                style={{
                  width: '100%', padding: '16px 20px', fontSize: 16,
                  background: '#18181f', border: '1.5px solid #2a2a35',
                  borderRadius: 12, color: '#fff', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#f5c542'}
                onBlur={e => e.target.style.borderColor = '#2a2a35'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                {error
                  ? <span style={{ fontSize: 13, color: '#f56565' }}>{error}</span>
                  : <span />
                }
                <span style={{ fontSize: 12, color: '#555' }}>{nickname.trim().length}/20</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || nickname.trim().length < 2}
              style={{
                width: '100%', padding: '16px', fontSize: 15, fontWeight: 700,
                background: saving || nickname.trim().length < 2 ? '#2a2a35' : '#f5c542',
                color: saving || nickname.trim().length < 2 ? '#555' : '#0e0e12',
                border: 'none', borderRadius: 12, cursor: saving || nickname.trim().length < 2 ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {saving ? '저장 중…' : '커뮤니티 시작하기 →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
