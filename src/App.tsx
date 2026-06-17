import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { trackPageView } from './lib/analytics'
import { LangProvider } from './context/LangContext'
import { AuthProvider } from './context/AuthContext'
import AppSidebar from './components/AppSidebar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Sessions from './pages/Sessions'
import Schedule from './pages/Schedule'
import Content from './pages/Content'
import ContentDetail from './pages/ContentDetail'
import Admin from './pages/Admin'
import ProgramDetail from './pages/ProgramDetail'
import ApplyPage from './pages/ApplyPage'
import BoardDetail from './pages/BoardDetail'
import CommunityDetail from './pages/CommunityDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Account from './pages/Account'
import ResetPassword from './pages/ResetPassword'
import RequireAuth from './components/RequireAuth'
import BoardMemoryWidget from './components/BoardMemoryWidget'
import Radar from './pages/Radar'
import ResumeMap from './pages/ResumeMap'
import Phrases from './pages/Phrases'
import Arriving from './pages/Arriving'
import Settling from './pages/Settling'
import SettlingArticle from './pages/SettlingArticle'
import { supabase } from './lib/supabase'

function RedirectContentId() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/news/${id}`} replace />
}

// Fires a GA4 page_view on every route change.
function RouteTracker() {
  const location = useLocation()
  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])
  return null
}

// Listens for Supabase PASSWORD_RECOVERY event and redirects to the reset form.
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

export default function App() {
  return (
    <AuthProvider>
    <LangProvider>
      <BrowserRouter>
        <div className="min-h-screen flex bg-white text-gray-900 font-sans">
          <RouteTracker />
          <AuthListener />
          <AppSidebar />
          <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/programs" element={<Sessions />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/apply/:id" element={<ApplyPage />} />
              <Route path="/board" element={<Schedule />} />
              <Route path="/board/:id" element={<BoardDetail />} />
              <Route path="/community/:id" element={<CommunityDetail />} />
              <Route path="/news" element={<Content />} />
              <Route path="/news/:id" element={<ContentDetail />} />
              {/* Backward-compat redirects */}
              <Route path="/schedule" element={<Navigate to="/board" replace />} />
              <Route path="/content" element={<Navigate to="/news" replace />} />
              <Route path="/content/:id" element={<RedirectContentId />} />
              <Route path="/arriving" element={<Arriving />} />
              <Route path="/settling" element={<Settling />} />
              <Route path="/settling/:slug" element={<SettlingArticle />} />
              <Route path="/radar" element={<Radar />} />
              <Route path="/resume-map" element={<ResumeMap />} />
              <Route path="/phrases" element={<Phrases />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/account" element={<Account />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/*" element={<RequireAuth><Admin /></RequireAuth>} />
            </Routes>
          </main>
          <Footer />
          </div>
          <BoardMemoryWidget />
        </div>
        <Analytics />
      </BrowserRouter>
    </LangProvider>
    </AuthProvider>
  )
}