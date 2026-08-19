import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { trackPageView } from './lib/analytics'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './lib/lang'
import { supabase } from './lib/supabase'
import CommunityLayout from './components/CommunityLayout'
import NewHome from './pages/NewHome'
import NewPrograms from './pages/NewPrograms'
import NewActivities from './pages/NewActivities'
import NewSchool from './pages/NewSchool'
import NewGallery from './pages/NewGallery'
import NewSettling from './pages/NewSettling'
import NewBoard from './pages/NewBoard'
import NewQna from './pages/NewQna'
import NewApply from './pages/NewApply'
import NewCommunity from './pages/NewCommunity'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'
import ResetPassword from './pages/ResetPassword'
import Admin from './pages/Admin'
import RequireAdmin from './components/RequireAdmin'

function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])
  return null
}

function AuthListener() {
  const navigate = useNavigate()
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])
  return null
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return <CommunityLayout>{children}</CommunityLayout>
}

export default function App() {
  return (
    <LangProvider>
    <AuthProvider>
      <BrowserRouter>
        <RouteTracker />
        <AuthListener />
        <Routes>
          {/* Public site */}
          <Route path="/" element={<PublicLayout><NewHome /></PublicLayout>} />
          <Route path="/programs" element={<PublicLayout><NewPrograms /></PublicLayout>} />
          <Route path="/programs/:slug" element={<PublicLayout><NewPrograms /></PublicLayout>} />
          <Route path="/activities" element={<PublicLayout><NewActivities /></PublicLayout>} />
          <Route path="/activities/:slug" element={<PublicLayout><NewActivities /></PublicLayout>} />
          <Route path="/school" element={<PublicLayout><NewSchool /></PublicLayout>} />
          <Route path="/gallery" element={<PublicLayout><NewGallery /></PublicLayout>} />
          <Route path="/settling" element={<PublicLayout><NewSettling /></PublicLayout>} />
          <Route path="/board" element={<PublicLayout><NewBoard /></PublicLayout>} />
          <Route path="/qna" element={<PublicLayout><NewQna /></PublicLayout>} />
          <Route path="/community/:channel" element={<PublicLayout><NewCommunity /></PublicLayout>} />
          <Route path="/apply/:type/:slug" element={<PublicLayout><NewApply /></PublicLayout>} />
          <Route path="/apply/:type" element={<PublicLayout><NewApply /></PublicLayout>} />

          {/* Auth pages (no public layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin/*" element={<RequireAdmin><Admin /></RequireAdmin>} />

          {/* Legacy redirects */}
          <Route path="/sessions" element={<Navigate to="/programs" replace />} />
          <Route path="/arriving" element={<Navigate to="/settling" replace />} />
          <Route path="/news" element={<Navigate to="/board" replace />} />
          <Route path="/schedule" element={<Navigate to="/board" replace />} />
          <Route path="/community/:id" element={<Navigate to="/" replace />} />
        </Routes>
        <Analytics />
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
  )
}
