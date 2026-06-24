import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const ADMIN_EMAILS = [
  'seojoo1124@gmail.com',
  'zoe.mekhoukh@gmail.com',
]

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  if (!session) return <Navigate to="/login" replace />

  const email = session.user?.email ?? ''
  if (!ADMIN_EMAILS.includes(email)) return <Navigate to="/" replace />

  return <>{children}</>
}
