import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import { AppShell, Topbar, StreakCard, ActionButtons } from '../components/Shell'
import { AIPreviewCard, QuoteCard, CommunityFeed } from '../components/Widgets'
import { StrongModal, RelapseModal, AIChatModal } from '../components/Modals'
import IrokoTree from '../components/IrokoTree'

export default function Dashboard() {
  const { session } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(true)
  const [selectedMood, setSelectedMood] = useState('Neutral')
  const [actionLoading, setActionLoading] = useState(false)
  
  // Modal states
  const [showStrongModal, setShowStrongModal] = useState(false)
  const [showRelapseModal, setShowRelapseModal] = useState(false)
  const [showAIChatModal, setShowAIChatModal] = useState(false)

  const isAlreadyCheckedIn = () => {
    if (!profile?.last_checkin) return false
    const today = new Date().toISOString().split('T')[0]
    return profile.last_checkin === today
  }

  const hasCheckedInToday = isAlreadyCheckedIn()

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user || !supabase) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
      setLoading(false)
    }
    loadProfile()
  }, [session])

  useEffect(() => {
    async function loadCommunityPreview() {
      try {
        setCommunityLoading(true)
        const { data, error } = await supabase
          .from('posts')
          .select('*, comments(count)')
          .order('created_at', { ascending: false })
          .limit(2)
        if (error) throw error
        setCommunityPosts(data || [])
      } catch (err) {
        console.error('Error loading community preview:', err.message)
        setCommunityPosts([])
      } finally {
        setCommunityLoading(false)
      }
    }
    loadCommunityPreview()
  }, [])

  const handleStayedStrong = async () => {
    if (actionLoading || hasCheckedInToday || !supabase) return
    setActionLoading(true)
    try {
      const newStreak = (profile?.streak_count || 0) + 1
      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase
        .from('profiles')
        .update({ 
          streak_count: newStreak,
          last_checkin: today
        })
        .eq('id', session.user.id)
      
      if (error) throw error

      await supabase.from('checkins').insert({ user_id: session.user.id, relapse: false })

      setProfile({ ...profile, streak_count: newStreak, last_checkin: today })
      setShowStrongModal(true)
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#16A34A', '#FFFFFF']
      })
    } catch (err) {
      console.error('Error updating streak:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRelapse = async () => {
    if (actionLoading || !supabase) return
    setActionLoading(true)
    
    // Optimistic UI update: Set streak to 0 immediately
    const today = new Date().toISOString().split('T')[0]
    const oldProfile = { ...profile }
    setProfile({ ...profile, streak_count: 0, last_checkin: today })
    setShowRelapseModal(false)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          streak_count: 0,
          last_checkin: today
        })
        .eq('id', session.user.id)
      
      if (error) throw error

      await supabase.from('checkins').insert({ user_id: session.user.id, relapse: true })

      // Wait a moment for the user to see the streak hit zero before navigating
      setTimeout(() => {
        navigate('/panic')
      }, 800)

    } catch (err) {
      console.error('Error resetting streak:', err)
      // Rollback if error
      setProfile(oldProfile)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <AppShell>
      <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep' : 'bg-gray-50'}`}>
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-glow" 
          />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary animate-pulse">
            NS
          </div>
        </div>
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <Topbar username={profile?.username} />
      
      <main className="space-y-12">
        {/* Welcome & Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className={`text-6xl font-black tracking-tighter leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Your journey,<br />
              <span className="text-primary">{profile?.username || 'there'}</span>
            </h2>
            <div className="text-3xl mt-4">🌱</div>
          </div>
          
          <p className={`text-xl font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
            "The secret of getting ahead is getting started." — one day at a time.
          </p>
        </motion.div>

        {/* I Chose Myself Today — Daily CTA (reuses Supabase last_checkin) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {hasCheckedInToday ? (
            <motion.div
              layout
              className={`rounded-[2.5rem] p-8 md:p-10 border relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-primary/10 border-primary/30 shadow-[0_0_60px_rgba(34,197,94,0.1)]' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
            >
              <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-30 ${theme === 'dark' ? 'bg-primary/40' : 'bg-primary/30'}`} />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-primary/20' : 'bg-primary/15'}`}>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="text-4xl md:text-5xl"
                    >❤️</motion.span>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-primary' : 'text-primaryDark'}`}>
                      Today · Logged
                    </p>
                    <h3 className={`text-2xl md:text-3xl font-black tracking-tight leading-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      You chose yourself today ❤️
                    </h3>
                    <p className={`text-sm md:text-base font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                      Proud of you. Come back tomorrow and do it again. Every single day counts.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-black text-xs md:text-sm uppercase tracking-widest ${theme === 'dark' ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-primary/10 text-primaryDark border border-primary/20'}`}>
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Completed
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              layout
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStayedStrong}
              disabled={actionLoading}
              className={`w-full rounded-[2.5rem] p-8 md:p-10 border text-left relative overflow-hidden group transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed ${theme === 'dark'
                ? 'bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-primary/30 hover:border-primary/50 hover:shadow-[0_0_80px_rgba(34,197,94,0.15)]'
                : 'bg-gradient-to-br from-primary/10 via-white to-primary/5 border-primary/20 hover:border-primary/30 shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${theme === 'dark' ? 'bg-primary' : 'bg-primary'}`} />
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-primary/15 group-hover:bg-primary/25'} transition-all duration-500 group-hover:scale-110`}>
                    <span className="text-4xl md:text-5xl">🌳</span>
                  </div>
                  <div className="space-y-2">
                    <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.3em] ${theme === 'dark' ? 'text-primary' : 'text-primaryDark'}`}>
                      Daily Commitment
                    </p>
                    <h3 className={`text-2xl md:text-4xl font-black tracking-tight leading-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      I Chose Myself Today
                    </h3>
                    <p className={`text-sm md:text-base font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                      Tap to log today's check-in — extend your streak and plant the seed for tomorrow's you.
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-xs md:text-sm uppercase tracking-widest transition-all duration-500 shadow-lg group-hover:shadow-primary/30 ${theme === 'dark'
                    ? 'bg-primary text-backgroundDeep hover:bg-primarySoft shadow-primary/20'
                    : 'bg-primary text-white hover:bg-primaryDark shadow-primary/20'
                  }`}>
                    {actionLoading ? (
                      <>
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        Logging...
                      </>
                    ) : (
                      <>
                        Confirm Today
                        <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          )}
        </motion.section>

        {/* Vertical Metric Cards Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 h-[280px] md:h-[300px] flex-nowrap overflow-x-auto pb-2 -mx-1 px-1 lg:flex-wrap lg:overflow-visible"
        >
          <div className="flex-1 min-w-[200px]">
            <StreakCard 
              streak={profile?.streak_count || 0} 
              label="CUR STR"
              sub="Days sober"
              colorClass="bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20"
              progress={((profile?.streak_count || 0) % 14 / 14 * 100).toFixed(0)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <StreakCard 
              streak={`Lv. ${Math.floor((profile?.streak_count || 0) / 14) + 1}`}
              label="GRO LEV"
              sub="Sprout stage"
              colorClass="bg-gradient-to-b from-nova/20 to-nova/5 border border-nova/20"
              progress={35}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <StreakCard 
              streak="S"
              label="VIT S"
              sub="Status Grow"
              colorClass="bg-gradient-to-b from-secondary/20 to-secondary/5 border border-secondary/20"
              progress={80}
            />
          </div>
        </motion.section>

        {/* Signature Tree Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Signature Tree</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Growing</span>
            </div>
          </div>
          
          <div className={`rounded-[2.5rem] p-6 md:p-10 border transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
            <div className="h-64 flex items-center justify-center">
              <IrokoTree streak={profile?.streak_count || 0} />
            </div>
            <div className="mt-8 flex flex-wrap gap-4 justify-between items-center">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Tree Health</p>
                <p className={`text-sm font-black transition-colors duration-300 ${theme === 'dark' ? 'text-primary' : 'text-primaryDark'}`}>Excellent</p>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Next Stage</p>
                <p className={`text-sm font-black transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Young Oak</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Action Buttons — all breakpoints now */}
        <div className="pb-12">
          <ActionButtons 
            onStrong={handleStayedStrong}
            onRelapse={() => setShowRelapseModal(true)}
            onAI={() => setShowAIChatModal(true)}
            onCommunity={() => navigate('/community')}
            disabled={hasCheckedInToday}
          />
        </div>

        {/* AI Companion Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-textSecondary/40 px-1">
            Guidance
          </h3>
          <AIPreviewCard onAction={() => setShowAIChatModal(true)} />
        </motion.section>

        {/* Inspirational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <QuoteCard />
        </motion.div>

        {/* Community Feed Preview */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6 pb-12"
        >
          <CommunityFeed 
            posts={communityPosts} 
            loading={communityLoading}
            onViewAll={() => navigate('/community')} 
            onPostClick={() => navigate('/community')}
          />
        </motion.section>
      </main>

      {/* Modals */}
      <StrongModal 
        isOpen={showStrongModal} 
        onClose={() => setShowStrongModal(false)} 
        streak={profile?.streak_count}
      />
      
      <RelapseModal 
        isOpen={showRelapseModal} 
        onClose={() => setShowRelapseModal(false)}
        onConfirm={handleRelapse}
      />

      <AIChatModal 
        isOpen={showAIChatModal}
        onClose={() => setShowAIChatModal(false)}
      />
    </AppShell>
  )
}
