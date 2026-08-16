import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App.jsx'
import { motion } from 'framer-motion'
import { AppShell, Topbar } from '../components/Shell'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { session, logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [session])

  async function loadProfile() {
    if (!session?.user) return
    try {
      setLoading(true)
      const { data: profileData, error: pErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (pErr) throw pErr

      const [{ count: totalCheckins, error: cErr }, { count: totalPosts, error: postErr }, { data: recentCheckins, error: rcErr }] = await Promise.all([
        supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', session.user.id),
        supabase.from('checkins').select('relapse').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(30),
      ])
      if (cErr || postErr || rcErr) throw cErr || postErr || rcErr

      const strongDays = recentCheckins.filter(c => !c.relapse).length
      const consistency = recentCheckins.length === 0 ? 0 : Math.round((strongDays / recentCheckins.length) * 100)

      setProfile(profileData)
      setUsername(profileData?.username || '')
      setBio(profileData?.bio || '')
      setStats({
        totalCheckins: totalCheckins || 0,
        totalPosts: totalPosts || 0,
        consistency,
      })
    } catch (err) {
      console.error('Profile load error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!session?.user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() || null, bio: bio.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', session.user.id)
      if (error) throw error
      setProfile(p => ({ ...p, username: username.trim() || null, bio: bio.trim() || null }))
      setEditing(false)
    } catch (err) {
      console.error('Profile save error:', err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    logout?.()
    navigate('/login')
  }

  if (loading) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-glow" />
      </div>
    </AppShell>
  )

  const level = Math.floor((profile?.streak_count || 0) / 14) + 1
  const levelNames = ['Seed', 'Sprout', 'Sapling', 'Young Oak', 'Strong Oak', 'Ancient Iroko']
  const levelName = levelNames[Math.min(level - 1, levelNames.length - 1)]
  const streak = profile?.streak_count || 0
  const best = profile?.best_streak || streak
  const initial = (profile?.username || session?.user?.email || 'U').charAt(0).toUpperCase()

  return (
    <AppShell>
      <Topbar />

      <main className="space-y-12 pb-12">
        {/* Header / Avatar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className={`rounded-[2.5rem] p-10 border relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
            <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-primary via-nova to-secondary`} />
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center text-5xl font-black border shadow-2xl ${theme === 'dark' ? 'bg-gradient-to-br from-primary/30 via-nova/30 to-secondary/30 border-white/10 text-white' : 'bg-gradient-to-br from-primary/20 via-nova/20 to-secondary/20 border-black/10 text-gray-900'}`}>
                {initial}
              </div>

              <div className="space-y-2">
                {editing ? (
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your display name..."
                    className={`bg-transparent outline-none text-center text-3xl font-black tracking-tight placeholder:opacity-40 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                    maxLength={20}
                  />
                ) : (
                  <h2 className={`text-3xl font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {profile?.username || 'Anonymous Hero'}
                  </h2>
                )}
                <p className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                  Level {level} · {levelName}
                </p>
                {session?.user?.email && (
                  <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>
                    {session.user.email}
                  </p>
                )}
              </div>

              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about your journey..."
                  rows={3}
                  className={`w-full max-w-md bg-transparent outline-none resize-none text-sm font-medium text-center leading-relaxed placeholder:opacity-40 transition-colors duration-300 ${theme === 'dark' ? 'text-white/70 placeholder:text-white/30' : 'text-gray-600 placeholder:text-gray-500'}`}
                  maxLength={240}
                />
              ) : (
                <p className={`text-sm font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                  {profile?.bio || '"Recovery isn\'t about perfection—it\'s about showing up for yourself, one small choice at a time."'}
                </p>
              )}

              <div className="flex gap-3">
                {editing ? (
                  <>
                    <button
                      onClick={() => { setEditing(false); setUsername(profile?.username || ''); setBio(profile?.bio || '') }}
                      className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors border ${theme === 'dark' ? 'text-white/40 border-white/5 hover:bg-white/5' : 'text-gray-500 border-black/5 hover:bg-gray-100'}`}
                    >
                      Cancel
                    </button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving} className="px-8 py-3.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-40">
                      {saving ? 'Saving...' : 'Save'}
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(true)} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${theme === 'dark' ? 'bg-white/5 text-white border-white/10 hover:bg-white/10' : 'bg-white text-gray-900 border-black/10 hover:bg-gray-50 shadow-sm'}`}>
                      Edit Profile
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout} className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-colors ${theme === 'dark' ? 'bg-panic/10 text-panic border-panic/20 hover:bg-panic/20' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}>
                      Sign Out
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Streak', value: `${streak}d`, sub: 'Current', color: 'primary', emoji: '🔥' },
              { label: 'Best', value: `${best}d`, sub: 'All time', color: 'nova', emoji: '⭐' },
              { label: 'Consistency', value: `${stats?.consistency ?? 0}%`, sub: `Last 30 · ${stats?.totalCheckins || 0} logs`, color: 'secondary', emoji: '📈' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }} className={`rounded-[2rem] p-6 border space-y-3 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className={`w-10 h-10 rounded-xl bg-${s.color}/15 flex items-center justify-center text-xl`}>{s.emoji}</div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{s.label}</p>
                  <p className={`text-3xl font-black mt-1 tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>{s.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Activity */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-[2rem] p-6 border space-y-2 transition-colors duration-300 cursor-pointer hover:border-primary/30 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`} onClick={() => navigate('/progress')}>
              <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Check-ins</p>
              <p className={`text-4xl font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats?.totalCheckins || 0}</p>
              <p className={`text-[10px] font-bold text-primary uppercase tracking-widest mt-2`}>View history →</p>
            </div>
            <div className={`rounded-[2rem] p-6 border space-y-2 transition-colors duration-300 cursor-pointer hover:border-community/30 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`} onClick={() => navigate('/community')}>
              <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Community Posts</p>
              <p className={`text-4xl font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stats?.totalPosts || 0}</p>
              <p className={`text-[10px] font-bold text-community uppercase tracking-widest mt-2`}>Open community →</p>
            </div>
          </div>
        </motion.section>

        {/* Quick Links */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
          <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Shortcuts</h3>
          <div className="space-y-3">
            {[
              { to: '/journal', label: 'Journal', sub: 'Write down your thoughts', emoji: '📓' },
              { to: '/mindfulness', label: 'Mindfulness Tools', sub: 'Breathe · Ground · Scan', emoji: '🧘' },
              { to: '/ai-therapist', label: 'Talk to Nova', sub: 'Your AI companion', emoji: '🤖' },
            ].map((l, i) => (
              <motion.button
                key={l.to}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(l.to)}
                className={`w-full rounded-[1.75rem] p-5 border flex items-center gap-5 transition-all text-left ${theme === 'dark' ? 'bg-[#0F172A] border-white/5 hover:border-white/10' : 'bg-gray-50 border-black/5 hover:border-black/10'}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-white border border-black/5'}`}>{l.emoji}</div>
                <div className="flex-1">
                  <p className={`text-sm font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{l.label}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{l.sub}</p>
                </div>
                <span className="text-lg opacity-30 group-hover:opacity-70">→</span>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </main>
    </AppShell>
  )
}
