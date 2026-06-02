import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    if (!supabase) {
      setSession(null)
      return
    }
    // Get current session on mount
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    // Stay in sync when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Still loading — show nothing to avoid flash
  if (session === undefined) return null

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
