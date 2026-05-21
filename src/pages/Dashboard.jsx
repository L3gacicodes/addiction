import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App.jsx'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import { AppShell, Topbar, BottomNav, StreakCard, ActionButtons } from '../components/Shell'
import { MoodSelector, WeeklyProgress, AIPreviewCard, QuoteCard, CommunityFeed } from '../components/Widgets'
import { StrongModal, RelapseModal, AIChatModal } from '../components/Modals'
import IrokoTree from '../components/IrokoTree'

export default function Dashboard() {
  const { session } = useAuth()
  const { theme } = useTheme()
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
              <span className="text-primary">{profile?.username || 'Kamsy'}</span>
            </h2>
            <div className="text-3xl mt-4">🌱</div>
          </div>
          
          <p className={`text-xl font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
            "The secret of getting ahead is getting started." — one day at a time.
          </p>
        </motion.div>

        {/* Vertical Metric Cards Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 h-[300px]"
        >
          <div className="flex-1">
            <StreakCard 
              streak={profile?.streak_count || 0} 
              label="CUR STR"
              sub="Days sober"
              colorClass="bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/20"
              progress={((profile?.streak_count || 0) % 14 / 14 * 100).toFixed(0)}
            />
          </div>
          <div className="flex-1">
            <StreakCard 
              streak={`Lv. ${Math.floor((profile?.streak_count || 0) / 14) + 1}`}
              label="GRO LEV"
              sub="Sprout stage"
              colorClass="bg-gradient-to-b from-nova/20 to-nova/5 border border-nova/20"
              progress={35}
            />
          </div>
          <div className="flex-1">
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
          
          <div className={`rounded-[2.5rem] p-10 border transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
            <div className="h-64 flex items-center justify-center">
              <IrokoTree streak={profile?.streak_count || 0} />
            </div>
            <div className="mt-8 flex justify-between items-center">
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

        {/* Action Buttons for Mobile */}
        <div className="lg:hidden pb-12">
          <ActionButtons 
            onStrong={handleStayedStrong}
            onRelapse={() => setShowRelapseModal(true)}
            onAI={() => setShowAIChatModal(true)}
            onCommunity={() => navigate('/community')}
            disabled={hasCheckedInToday}
          />
        </div>
      </main>


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
