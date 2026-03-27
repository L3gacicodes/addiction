import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import { AppShell, Topbar, BottomNav, StreakCard, ActionButtons } from '../components/Shell'
import { MoodSelector, WeeklyProgress, AIPreviewCard, QuoteCard, CommunityFeed } from '../components/Widgets'
import { StrongModal, RelapseModal, AIChatModal } from '../components/Modals'
import IrokoTree from '../components/IrokoTree'

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
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
      if (!session?.user) return
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

  const handleStayedStrong = async () => {
    if (actionLoading || hasCheckedInToday) return
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
    if (actionLoading) return
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
      <div className="flex-1 flex items-center justify-center bg-background">
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
      
      <main className="flex-1 px-5 pt-6 space-y-section overflow-y-auto no-scrollbar scroll-smooth">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1"
        >
          <h2 className="text-[26px] font-black text-textPrimary tracking-tight uppercase leading-none">
            Your Space, {profile?.username?.split(' ')[0] || 'Kamsy'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-glow" />
            <p className="text-textSecondary text-[10px] font-black uppercase tracking-[0.25em] opacity-60">
              Healing in progress • Day {profile?.streak_count || 0}
            </p>
          </div>
        </motion.div>

        {/* Main Stats Card & Signature Tree */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-4 h-[220px]"
        >
          <StreakCard streak={profile?.streak_count || 0} />
          <IrokoTree streak={profile?.streak_count || 0} />
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-textSecondary/40">
              Today's Choice
            </h3>
            <span className="text-[9px] font-black text-primary/30 uppercase tracking-widest">Active</span>
          </div>
          <ActionButtons 
            onStrong={handleStayedStrong}
            onRelapse={() => setShowRelapseModal(true)}
            onAI={() => setShowAIChatModal(true)}
            onCommunity={() => navigate('/community')}
            disabled={hasCheckedInToday}
          />
        </motion.section>

        {/* Mood Selector */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-textSecondary/40 px-1">
            Mental Pulse
          </h3>
          <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
        </motion.section>

        {/* Progress Chart */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-textSecondary/40 px-1">
            Growth Metrics
          </h3>
          <WeeklyProgress />
        </motion.section>

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
          <CommunityFeed onViewAll={() => navigate('/community')} />
        </motion.section>
      </main>

      <BottomNav />

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
