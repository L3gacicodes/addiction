import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../App'

export const AppShell = ({ children }) => {
  const { theme } = useTheme()
  return (
    <div className={`min-h-screen flex justify-center items-start overflow-x-hidden selection:bg-primary/30 relative transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep' : 'bg-gray-50'}`}>
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-nova/10' : 'bg-nova/5'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] ${theme === 'dark' ? 'bg-primary/10' : 'bg-primary/5'}`} />
        <div className={`absolute top-[30%] right-[5%] w-[30%] h-[30%] rounded-full blur-[100px] ${theme === 'dark' ? 'bg-secondary/5' : 'bg-secondary/3'}`} />
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-radial-gradient(circle at top, rgba(34,197,94,0.05), transparent 60%)' : 'bg-radial-gradient(circle at top, rgba(34,197,94,0.02), transparent 60%)'}`} />
      </div>

      {/* Desktop Left Panel */}
      <div className={`hidden lg:flex flex-col w-80 h-screen sticky top-0 p-8 space-y-8 text-left border-r backdrop-blur-3xl transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-backgroundDeep/50' : 'border-black/5 bg-white/50'}`}>
        <div className="space-y-2">
          <h2 className={`text-3xl font-black uppercase tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Your Journey</h2>
          <p className={`text-sm leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>"The secret of getting ahead is getting started." You're building a new life, one day at a time.</p>
        </div>
        <div className={`rounded-3xl p-6 border transition-colors duration-300 ${theme === 'dark' ? 'bg-surface/50 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Daily Focus</p>
          <p className={`text-sm font-medium italic transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-800'}`}>"Self-discipline is the highest form of self-love."</p>
        </div>
      </div>

      {/* Main App Shell */}
      <div className={`w-full max-w-mobile min-h-screen relative flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.1)] border-x transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep border-white/[0.02]' : 'bg-white border-black/[0.02]'}`}>
        <div className="flex-1 flex flex-col pt-[env(safe-area-inset-top,20px)] pb-[env(safe-area-inset-bottom,100px)]">
          {children}
        </div>
      </div>

      {/* Desktop Right Panel */}
      <div className={`hidden lg:flex flex-col w-80 h-screen sticky top-0 p-8 space-y-8 text-left border-l backdrop-blur-3xl transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-backgroundDeep/50' : 'border-black/5 bg-white/50'}`}>
        <div className="space-y-4">
          <h2 className={`text-xl font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Community Feed</h2>
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className={`rounded-2xl p-4 border space-y-2 transition-colors duration-300 ${theme === 'dark' ? 'bg-surface/30 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20" />
                  <span className={`text-[10px] font-bold uppercase transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-800'}`}>Anonymous</span>
                </div>
                <p className={`text-[11px] line-clamp-2 italic transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>"I stayed strong today even when things got tough..."</p>
              </div>
            ))}
          </div>
        </div>
        <div className={`mt-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl p-6 border text-center group cursor-pointer transition-all ${theme === 'dark' ? 'border-white/10 hover:border-primary/30' : 'border-black/5 hover:border-primary/20'}`}>
          <p className={`text-xs font-black uppercase mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Need to talk?</p>
          <button className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:underline">Start AI Session →</button>
        </div>
      </div>
    </div>
  )
}

export const Topbar = ({ username, avatarUrl }) => {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className={`px-6 py-5 flex items-center justify-between sticky top-0 backdrop-blur-xl z-20 border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/60 border-white/[0.03]' : 'bg-white/60 border-black/[0.03]'}`}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-[1.2rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-glow">
          <span className="text-2xl">🌳</span>
        </div>
        <div>
          <h1 className="text-[11px] font-black text-primary leading-none uppercase tracking-[0.3em]">Noshake</h1>
          <p className={`text-[13px] font-black uppercase tracking-tighter mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Hello, {username || 'Kamsy'}!</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          onClick={toggleTheme}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
        >
          <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.9 }} 
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 border ${theme === 'dark' ? 'bg-surface text-textSecondary border-white/[0.05] hover:text-textPrimary' : 'bg-white text-gray-400 border-black/[0.05] hover:text-gray-900 shadow-sm'}`}
        >
          <span className="text-xl">🔔</span>
        </motion.button>
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/40 to-secondarySoft/40 p-[1.5px] shadow-lg">
          <div className={`w-full h-full rounded-[0.95rem] flex items-center justify-center overflow-hidden border transition-colors duration-300 ${theme === 'dark' ? 'bg-surface border-white/5' : 'bg-white border-black/5'}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              <span className={`text-sm font-black uppercase transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-800'}`}>{username?.[0] || 'K'}</span>
            )}
          </div>
        </div>
      </div>
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
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] backdrop-blur-2xl border p-1.5 rounded-[2.5rem] flex items-center justify-between z-30 transition-all duration-300 h-20 ${theme === 'dark' ? 'bg-surface/40 border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white/80 border-black/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.1)]'}`}>
      {items.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Link key={item.path} to={item.path} className="relative flex-1 flex flex-col items-center justify-center py-2 gap-1 group h-full">
            {isActive && (
              <motion.div 
                layoutId="nav-bg"
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
            <span className={`text-[9px] z-10 font-black uppercase tracking-tighter ${isActive ? 'text-primary' : (item.label === 'Panic' ? 'text-panic/70' : (theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'))}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export const StreakCard = ({ streak }) => {
  const { theme } = useTheme()
  const percentage = Math.min((streak / 14) * 100, 100)
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5, shadow: theme === 'dark' ? '0 20px 40px rgba(34, 197, 94, 0.2)' : '0 10px 30px rgba(34, 197, 94, 0.1)' }}
      className={`rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative group h-full flex flex-col justify-between min-h-[200px] transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-primary to-primarySoft shadow-primary/20' : 'bg-gradient-to-br from-primary/90 to-primarySoft/90 shadow-primary/10'}`}
    >
      {/* Background Illustration */}
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 19c-4 0-6-2-6-6 0-3 2-5 6-5s6 2 6 5c0 4-2 6-6 6z" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col h-full justify-center items-center text-center space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Current Streak</p>
        <motion.h2 
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-7xl font-black tracking-tighter leading-none"
        >
          {streak}
        </motion.h2>
        <p className="text-sm font-black uppercase tracking-widest opacity-90">Days Sober</p>
        
        <div className="w-full max-w-[200px] mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Growth Progress</span>
            <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Lv. {Math.floor(streak / 14) + 1}</span>
          </div>
          <div className="h-2 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
              className="h-full bg-white rounded-full relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-white animate-pulse" />
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Background Orbs */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-[50px] group-hover:bg-white/20 transition-colors" />
      <div className="absolute -left-8 -top-8 w-32 h-32 bg-secondarySoft/20 rounded-full blur-[50px]" />
    </motion.div>
  )
}

export const ActionButtons = ({ onStrong, onRelapse, onAI, onCommunity, disabled = false }) => {
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
          className={`aspect-[1/1.1] bg-surface/40 backdrop-blur-xl rounded-[2.5rem] p-6 flex flex-col justify-between items-start border border-white/[0.08] transition-all group shadow-2xl ${btn.opacity} ${btn.border} hover:shadow-glow/20 relative overflow-hidden`}
        >
          {/* Feature Gradient Background Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${btn.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
          
          {btn.illustration}

          <div className={`w-14 h-14 rounded-2xl ${btn.bg} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform border border-white/5 shadow-inner z-10`}>
            {btn.icon}
          </div>
          <div className="relative z-10 mt-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-textSecondary mb-1 opacity-60 leading-none">{btn.sub}</p>
            <p className={`text-xl font-black uppercase tracking-tighter leading-none ${!disabled && (btn.color === 'panic' ? 'text-panic' : (btn.color === 'nova' ? 'text-nova' : (btn.color === 'community' ? 'text-community' : 'text-textPrimary')))}`}>
              {btn.label}
            </p>
          </div>
          {!disabled && <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${btn.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity`} />}
        </motion.button>
      ))}
    </div>
  )
}
