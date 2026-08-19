import { motion } from 'framer-motion'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTheme, useAuth } from '../App'
import { supabase } from '../lib/supabaseClient'

export const AppShell = ({ children }) => {
  const { theme, toggleTheme } = useTheme()
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarPosts, setSidebarPosts] = useState([])
  const [sidebarLoading, setSidebarLoading] = useState(true)
  const [username, setUsername] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadUsername() {
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single()
      if (!cancelled) setUsername(data?.username || null)
    }
    loadUsername()
    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    let cancelled = false
    async function loadSidebarPosts() {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, comments(count)')
          .order('created_at', { ascending: false })
          .limit(3)
        if (error) throw error
        if (!cancelled) setSidebarPosts(data || [])
      } catch (err) {
        console.error('Error loading sidebar posts:', err.message)
        if (!cancelled) setSidebarPosts([])
      } finally {
        if (!cancelled) setSidebarLoading(false)
      }
    }
    loadSidebarPosts()
    return () => { cancelled = true }
  }, [])

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diffMs / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const sidebarItems = [
    { group: 'MAIN', items: [
      { path: '/dashboard', label: 'Home', icon: '🏠', color: 'primary' },
      { path: '/community', label: 'Community', icon: '👥', color: 'textSecondary' },
      { path: '/ai-therapist', label: 'Nova AI', icon: '🤖', color: 'nova' },
      { path: '/progress', label: 'Progress', icon: '📊', color: 'secondary' },
    ]},
    { group: 'TOOLS', items: [
      { path: '/mindfulness', label: 'Mindfulness', icon: '🧘', color: 'primary' },
      { path: '/journal', label: 'Journal', icon: '📓', color: 'textSecondary' },
      { path: '/panic', label: 'Panic Button', icon: '🚨', color: 'panic', isPanic: true },
    ]}
  ]

  return (
    <div className={`min-h-screen flex justify-center items-start overflow-x-hidden selection:bg-primary/30 relative transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-[#F5F5F7]'}`}>
      {/* Sidebar - Left */}
      <div className={`hidden lg:flex flex-col w-72 h-screen sticky top-0 p-8 space-y-10 border-r transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-[#020617]' : 'border-black/5 bg-[#F5F5F7]'}`}>
        {/* Utility Controls: Dark Mode + Notifications (far-left control group) */}
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
          >
            <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            aria-label="Notifications"
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
          >
            <span className="text-xl">🔔</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <h1 className={`text-xl font-black tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Noshake</h1>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] leading-none">Recovery</p>
          </div>
        </div>

        <nav className="space-y-10">
          {sidebarItems.map((group) => (
            <div key={group.group} className="space-y-4">
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-300 ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>{group.group}</p>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
                        isActive 
                          ? 'bg-primary/10 border border-primary/20' 
                          : item.isPanic 
                            ? 'bg-panic/10 border border-panic/20' 
                            : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-black/5'
                      }`}
                    >
                      <span className="text-lg relative z-10">{item.icon}</span>
                      <span className={`text-[13px] font-black tracking-tight relative z-10 transition-colors duration-300 ${
                        isActive 
                          ? 'text-primary' 
                          : item.isPanic 
                            ? 'text-panic' 
                            : theme === 'dark' ? 'text-textSecondary group-hover:text-textPrimary' : 'text-gray-600'
                      }`}>
                        {item.label}
                      </span>
                      {isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content - Center */}
      <div className={`w-full max-w-2xl min-h-screen relative flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-[#020617]' : 'bg-[#F5F5F7] lg:bg-white'}`}>
        <div className="flex-1 flex flex-col pt-8 px-6 lg:pt-12 lg:px-10 pb-32 lg:pb-12">
          {children}
        </div>
      </div>

      {/* Side Panel - Right */}
      <div className={`hidden lg:flex flex-col w-96 h-screen sticky top-0 p-10 space-y-12 border-l transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-[#020617]' : 'border-black/5 bg-[#F5F5F7]'}`}>
        {/* Nova AI Card */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Nova AI</h2>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Always on</span>
          </div>
          
          <div className={`rounded-[2.5rem] p-8 border relative overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5 shadow-2xl shadow-nova/10' : 'bg-white border-black/5 shadow-sm'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-nova/20 flex items-center justify-center text-2xl">🤖</div>
              <div>
                <h3 className={`text-base font-black uppercase transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>NOVA</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Always listening</span>
                </div>
              </div>
            </div>
            <p className={`text-sm font-medium leading-relaxed mb-8 transition-colors duration-300 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
              What's on your mind today{username ? `, ${username}` : ''}? I'm here whenever you need to talk.
            </p>
            <button className={`w-full py-4 rounded-2xl flex items-center justify-between px-6 transition-all border group ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20' : 'bg-[#F5F5F7] border-black/5 text-gray-400 hover:bg-gray-100'}`}>
              <span className="text-[11px] font-black uppercase tracking-widest">Start AI session...</span>
              <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        {/* Community Feed */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Community Feed</h2>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>Live</span>
          </div>
          
          <div className="space-y-4">
            {sidebarLoading ? (
              [1, 2].map(i => (
                <div key={i} className={`rounded-[2rem] h-24 border animate-pulse transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`} />
              ))
            ) : sidebarPosts.length === 0 ? (
              <div className={`rounded-[2rem] p-6 border text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <p className={`text-[11px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                  Be the first to share something.
                 </p>
              </div>
            ) : (
              sidebarPosts.map(post => (
                <div 
                  key={post.id} 
                  onClick={() => navigate('/community')}
                  className={`rounded-[2rem] p-6 border space-y-4 cursor-pointer transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5 hover:border-white/10' : 'bg-white border-black/5 shadow-sm hover:border-black/10'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">A</div>
                    <div>
                      <span className={`text-[11px] font-black transition-colors duration-300 ${theme === 'dark' ? 'text-white/60' : 'text-gray-700'}`}>Anonymous</span>
                      <span className={`text-[10px] font-bold ml-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white/20' : 'text-gray-400'}`}>{timeAgo(post.created_at)}</span>
                    </div>
                   </div>
                  <p className={`text-[12px] leading-relaxed line-clamp-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white/80' : 'text-gray-600'}`}>
                    {post.title}
                  </p>
                  <div className="flex items-center gap-4 text-[10px] font-black transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}">
                    <div className="flex items-center gap-1.5">
                      <span>▲</span> {post.upvotes || 0}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>💬</span> {post.comments?.[0]?.count || 0} comments
                    </div>
                   </div>
                 </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  )
}

export const Topbar = ({ username, avatarUrl }) => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="flex items-center justify-between mb-10 lg:absolute lg:top-12 lg:right-10 lg:left-10">
      {/* Utility Controls - Mobile only (lg: hidden, since lg uses sidebar) */}
      <div className="flex items-center gap-3 lg:hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
        >
          <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          aria-label="Notifications"
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
        >
          <span className="text-xl">🔔</span>
        </motion.button>
      </div>
      <div className="lg:hidden" />
    </div>
  )
}

export const BottomNav = () => {
  const location = useLocation()
  const { theme } = useTheme()
  const items = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/community', icon: '👥', label: 'Social' },
    { path: '/panic', icon: '🚨', label: 'Panic' },
    { path: '/ai-therapist', icon: '🤖', label: 'Nova' },
    { path: '/profile', icon: '👤', label: 'Me' },
  ]

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] backdrop-blur-2xl border p-1.5 rounded-[2.5rem] flex items-center justify-between z-30 transition-all duration-300 h-20 lg:hidden ${theme === 'dark' ? 'bg-surface/40 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-black/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.1)]'}`}>
      {items.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link key={item.path} to={item.path} className="relative flex-1 flex flex-col items-center justify-center py-2 gap-1 group h-full">
            {isActive && (
              <motion.div 
                layoutId="nav-bg-mobile"
                className={`absolute inset-0 rounded-[1.8rem] border mx-1 ${theme === 'dark' ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'}`}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`text-2xl z-10 transition-all duration-300 ${isActive ? 'text-primary scale-110 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]' : (item.label === 'Panic' ? 'text-panic/70' : (theme === 'dark' ? 'text-textSecondary group-hover:text-textPrimary' : 'text-gray-400 group-hover:text-gray-900'))}`}
            >
              {item.icon}
            </motion.div>
          </Link>
        )
      })}
    </div>
  )
}

export const StreakCard = ({ streak, label, sub, colorClass, progress }) => {
  const { theme } = useTheme()
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-[2rem] p-6 text-white overflow-hidden relative group h-full flex flex-col justify-between min-h-[160px] transition-all duration-300 ${colorClass}`}
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">{label}</p>
        <div>
          <h2 className="text-4xl font-black tracking-tighter leading-none mb-1">{streak}</h2>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{sub}</p>
        </div>
        
        {progress !== undefined && (
          <div className="w-full mt-4">
            <div className="h-1 bg-black/20 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-white rounded-full relative"
              />
            </div>
            <p className="text-[8px] font-black uppercase tracking-widest mt-2 opacity-50">{progress}% to next level</p>
          </div>
        )}
      </div>
      
      {/* Background Graphic */}
      <div className="absolute -right-4 -top-4 opacity-10 text-6xl">✨</div>
    </motion.div>
  )
}


export const ActionButtons = ({ onStrong, onRelapse, onAI, onCommunity, disabled = false }) => {
  const { theme } = useTheme()
  const buttons = [
    { 
      label: disabled ? 'Logged' : 'Strong', 
      sub: disabled ? 'Today' : 'I chose myself', 
      icon: disabled ? '✨' : '🌳', 
      color: 'primary', 
      gradient: 'from-primary/20 to-primarySoft/20',
      activeGradient: 'from-primary to-primarySoft',
      onClick: disabled ? null : onStrong,
      bg: disabled ? 'bg-white/10' : 'bg-primary/10',
      border: disabled ? 'border-white/10' : 'hover:border-primary/40',
      opacity: disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100',
      illustration: (
        <svg className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19c-4 0-6-2-6-6 0-3 2-5 6-5s6 2 6 5c0 4-2 6-6 6z" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
      )
    },
    { 
      label: 'Panic', 
      sub: 'I slipped', 
      icon: '🚨', 
      color: 'panic', 
      gradient: 'from-panic/20 to-panic/10',
      activeGradient: 'from-panic to-panic',
      onClick: onRelapse,
      bg: 'bg-panic/10',
      border: 'hover:border-panic/40',
      opacity: 'opacity-100',
      illustration: (
        <svg className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    { 
      label: 'Nova', 
      sub: 'Talk to Nova', 
      icon: '🤖', 
      color: 'nova', 
      gradient: 'from-nova/20 to-secondarySoft/20',
      activeGradient: 'from-nova to-secondarySoft',
      onClick: onAI,
      bg: 'bg-nova/10',
      border: 'hover:border-nova/40',
      opacity: 'opacity-100',
      illustration: (
        <svg className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
          <circle cx="12" cy="12" r="4" opacity="0.3" />
        </svg>
      )
    },
    { 
      label: 'Alone', 
      sub: "You're not alone", 
      icon: '👥', 
      color: 'community', 
      gradient: 'from-community/20 to-secondarySoft/20',
      activeGradient: 'from-community to-secondarySoft',
      onClick: onCommunity,
      bg: 'bg-community/5',
      border: 'hover:border-community/20',
      opacity: 'opacity-100',
      illustration: (
        <svg className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {buttons.map((btn, i) => (
        <motion.button
          key={i}
          whileHover={btn.onClick ? { y: -5, scale: 1.02 } : {}}
          whileTap={btn.onClick ? { scale: 0.95 } : {}}
          onClick={btn.onClick}
          disabled={!btn.onClick}
          className={`aspect-[1/1.1] backdrop-blur-xl rounded-[2.5rem] p-6 flex flex-col justify-between items-start border transition-all group shadow-2xl ${btn.opacity} ${btn.border} hover:shadow-glow/20 relative overflow-hidden ${theme === 'dark' ? 'bg-surface/40 border-white/[0.08]' : 'bg-white border-black/[0.05] shadow-sm'}`}
        >
          {/* Feature Gradient Background Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${btn.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          
          {btn.illustration}

          <div className={`w-14 h-14 rounded-2xl ${btn.bg} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform border ${theme === 'dark' ? 'border-white/5' : 'border-black/5'} shadow-inner z-10`}>
            {btn.icon}
          </div>
          <div className="relative z-10 mt-4">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60 leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>{btn.sub}</p>
            <p className={`text-xl font-black uppercase tracking-tighter leading-none transition-colors duration-300 ${!disabled && (btn.color === 'panic' ? 'text-panic' : (btn.color === 'nova' ? 'text-nova' : (btn.color === 'community' ? 'text-community' : (theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'))))}`}>
              {btn.label}
            </p>
          </div>
          {!disabled && <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${btn.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity`} />}
        </motion.button>
      ))}
    </div>
  )
}
