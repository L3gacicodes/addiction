import { useState } from 'react'
import { useAuth } from '../App.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [username, setUsername] = useState('')
  const [addictionType, setAddictionType] = useState('porn')
  const [startDate, setStartDate] = useState('')

  const completeOnboarding = async (e) => {
    e.preventDefault()
    if (!supabase || !session?.user) {
      navigate('/dashboard', { replace: true })
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase
      .from('profiles')
      .update({
        username,
        addiction_type: addictionType,
        start_date: startDate || null,
        onboarding_complete: true,
      })
      .eq('id', session.user.id)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-lg bg-white shadow-sm rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Onboarding</h1>
        <form onSubmit={completeOnboarding} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Addiction type</label>
            <select
              value={addictionType}
              onChange={(e) => setAddictionType(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="porn">Porn</option>
              <option value="betting">Betting</option>
              <option value="drugs">Drugs</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <div className="rounded bg-red-50 text-red-700 px-3 py-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  )
}
