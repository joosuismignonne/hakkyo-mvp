import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from './context/LangContext'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Home from './pages/Home'
import Sessions from './pages/Sessions'
import Schedule from './pages/Schedule'
import Content from './pages/Content'
import ContentDetail from './pages/ContentDetail'
import Admin from './pages/Admin'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans">
          <Nav />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/programs" element={<Sessions />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/content" element={<Content />} />
              <Route path="/content/:id" element={<ContentDetail />} />
              <Route path="/admin/*" element={<Admin />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LangProvider>
  )
}