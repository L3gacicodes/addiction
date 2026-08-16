import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App.jsx'
import { motion } from 'framer-motion'
import { AppShell, Topbar, StreakCard } from '../components/Shell'
import { WeeklyProgress } from '../components/Widgets'

export default function ProgressPage() {
  const { session } = useAuth()
  const { theme } = useTheme()
  const [profile, setProfile] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      if (!session?.user) return
      try {
        const [{ data: profileData }, { data: checkinData }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('checkins').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(30),
        ])
        setProfile(profileData)
        setCheckins(checkinData || [])
      } catch (err) {
        console.error('Progress load error:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [session])

  const totalCheckins = checkins.length
  const strongCheckins = checkins.filter(c => !c.relapse).length
  const streak = profile?.streak_count || 0
  const bestStreak = profile?.best_streak || streak
  const consistencyPct = totalCheckins === 0 ? 0 : Math.round((strongCheckins / totalCheckins) * 100)

  if (loading) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-glow" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <Topbar username={profile?.username} />

      <main className="space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-2">
            <h2 className={`text-5xl font-black tracking-tighter leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Your growth,<br />
              <span className="text-primary">{profile?.username || 'there'}</span>
            </h2>
            <div className="text-3xl mt-4">📊</div>
          </div>
          <p className={`text-xl font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
            "Progress, not perfection." Your story in numbers.
          </p>
        </motion.div>

        {/* Stat grid */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-4 h-[220px]">
          <div className="flex-1">
            <StreakCard streak={streak} label="CUR STR" sub="Days sober" colorClass="bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20" progress={((streak % 14) / 14 * 100).toFixed(0)} />
          </div>
          <div className="flex-1">
            <StreakCard streak={bestStreak} label="BEST" sub="Longest streak" colorClass="bg-gradient-to-b from-nova/20 to-nova/5 border border-nova/20" progress={bestStreak > 0 ? Math.min(100, Math.round((streak / bestStreak) * 100)) : 0} />
          </div>
          <div className="flex-1">
            <StreakCard streak={`${consistencyPct}%`} label="CONSIST" sub={`${strongCheckins}/${totalCheckins} strong days`} colorClass="bg-gradient-to-b from-secondary/20 to-secondary/5 border border-secondary/20" progress={consistencyPct} />
          </div>
        </motion.section>

        {/* Weekly Chart */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Weekly Snapshot</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Live</span>
            </div>
          </div>
          <WeeklyProgress />
        </motion.section>

        {/* Checkin History */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-6 pb-12">
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Check-in History</h3>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Last {checkins.length}</span>
          </div>

          {checkins.length === 0 ? (
            <div className={`rounded-[2rem] p-10 border text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <span className="text-4xl block mb-4">🌱</span>
              <p className={`text-sm font-medium italic transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>No check-ins yet. Head to the dashboard and log your first strong day.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkins.map((c, i) => (
                <motion.div key={c.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`rounded-[1.5rem] p-5 border flex items-center justify-between gap-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl ${c.relapse ? 'bg-panic/15' : 'bg-primary/15'}`}>
                      {c.relapse ? '🚨' : '🌳'}
                    </div>
                    <div>
                      <p className={`text-sm font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {c.relapse ? 'Relapse logged' : 'Stayed strong'}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                        {new Date(c.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(c.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${c.relapse ? 'bg-panic/10 text-panic' : 'bg-primary/10 text-primary'}`}>
                    {c.relapse ? 'Reset' : 'Strong'}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </AppShell>
  )
}
