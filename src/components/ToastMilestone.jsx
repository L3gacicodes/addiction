import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../App.jsx'
import { supabase } from '../lib/supabaseClient.js'

function messageFor(streak) {
  if (streak === 30) return 'Congrats! You reached a 30-day streak! Mature Iroko unlocked!'
  if (streak === 14) return 'Amazing! 14-day streak! Your Iroko is growing strong!'
  if (streak === 7) return 'Great job! 7-day streak! New Iroko level unlocked!'
  return ''
}

export default function ToastMilestone({ streak, irokoLevel }) {
  const { session } = useAuth()
  const [show, setShow] = useState(false)
  const [text, setText] = useState('')
  const milestones = useMemo(() => [7, 14, 30], [])

  useEffect(() => {
    if (!streak || !milestones.includes(streak)) return
    const key = 'milestone_notified'
    const raw = localStorage.getItem(key)
    const set = new Set(raw ? JSON.parse(raw) : [])
    if (!set.has(streak)) {
      setText(messageFor(streak))
      setShow(true)
      setTimeout(() => setShow(false), 4500)
      set.add(streak)
      localStorage.setItem(key, JSON.stringify(Array.from(set)))
    }
  }, [streak, milestones])

  useEffect(() => {
    async function sync() {
      if (!supabase || !session?.user) return
      if (!streak || !milestones.includes(streak)) return
      const { data, error } = await supabase
        .from('profiles')
        .select('streak_count, iroko_level')
        .eq('id', session.user.id)
        .single()
      if (error) return
      const sc = data?.streak_count ?? 0
      const il = data?.iroko_level ?? 1
      if (sc === streak && il === irokoLevel) return
    }
    sync()
  }, [streak, irokoLevel, session, milestones])

  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex items-center gap-3 bg-white shadow-lg border rounded-lg px-4 py-3 animate-[fadein_300ms_ease-out]">
        <div className="w-8 h-8 rounded-full bg-yellow-300 flex items-center justify-center animate-bounce">🏅</div>
        <div>
          <div className="font-semibold text-gray-900">{text}</div>
          <div className="text-xs text-gray-600">Streak {streak} days • Level {irokoLevel}</div>
        </div>
      </div>
      <style>{`@keyframes fadein { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
