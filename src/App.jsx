import { useEffect, useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.js'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Onboarding from './pages/Onboarding.jsx'
import { ensureProfile } from './lib/profile.js'
import PanicPage from './pages/PanicPage.jsx'
import AITherapistPage from './pages/AITherapistPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import DesignSystemPage from './pages/DesignSystemPage.jsx'

const AuthContext = createContext({ session: null })

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  const handlePostLogin = async (user) => {
    if (!supabase || !user) {
      navigate('/dashboard', { replace: true })
      return
    }
    const profile = await ensureProfile(supabase, user.id)
    if (profile && profile.onboarding_complete) {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }

  useEffect(() => {
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_IN' && session) {
        handlePostLogin(session.user)
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  if (!supabase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <h1 className="text-xl font-bold text-red-800 mb-2">Configuration Error</h1>
        <p className="text-red-600 text-center">
          Supabase is not configured correctly. Please check your <code>.env</code> file for{' '}
          <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
        </p>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ session }}>
      <div className="min-h-screen">
        <Routes>
          <Route
            path="/"
            element={
              session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/panic"
            element={
              <ProtectedRoute>
                <PanicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-therapist"
            element={
              <ProtectedRoute>
                <AITherapistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route path="/design-system" element={<DesignSystemPage />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  )
}
