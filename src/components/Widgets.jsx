import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useTheme } from '../App'

export const MoodSelector = ({ selectedMood, onSelect }) => {
  const { theme } = useTheme()
  const moods = [
    { icon: '😊', label: 'Great' },
    { icon: '😐', label: 'Neutral' },
    { icon: '😔', label: 'Struggling' },
    { icon: '😡', label: 'Angry' },
    { icon: '😴', label: 'Tired' },
  ]

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
      {moods.map((mood, i) => {
        const isActive = selectedMood === mood.label
        return (
          <motion.button
            key={mood.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(mood.label)}
            className={`flex-shrink-0 px-5 py-4 rounded-[2rem] border flex flex-col items-center gap-2 transition-all min-w-[90px] backdrop-blur-xl ${
              isActive
                ? 'bg-primary border-primary text-white shadow-glow'
                : theme === 'dark' 
                  ? 'bg-surface/40 border-white/[0.08] text-textSecondary hover:border-white/20' 
                  : 'bg-white border-black/[0.05] text-gray-500 hover:border-black/10 shadow-sm'
            }`}
          >
            <span className="text-2xl">{mood.icon}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : (theme === 'dark' ? 'text-textSecondary' : 'text-gray-500')}`}>
              {mood.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

export const WeeklyProgress = () => {
  const { theme } = useTheme()
  const [hoveredDay, setHoveredDay] = useState(null)
  
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Data Structure: Consistency (0-2.5) + Recovery Pulse (0-2.5) = Total (5.0 max)
  const metrics = [
    { consistency: 2.5, pulse: 1.5, mood: 'Neutral', tools: true, checkedIn: true, noRelapse: true },
    { consistency: 2.0, pulse: 2.5, mood: 'Great', tools: false, checkedIn: true, noRelapse: true },
    { consistency: 2.5, pulse: 2.0, mood: 'Great', tools: true, checkedIn: true, noRelapse: true },
    { consistency: 1.0, pulse: 0.5, mood: 'Angry', tools: false, checkedIn: true, noRelapse: false }, // Relapse Day
    { consistency: 1.5, pulse: 0.8, mood: 'Struggling', tools: true, checkedIn: true, noRelapse: true },
    { consistency: 2.5, pulse: 1.5, mood: 'Neutral', tools: true, checkedIn: true, noRelapse: true },
    { consistency: 2.5, pulse: 2.5, mood: 'Great', tools: true, checkedIn: true, noRelapse: true },
  ]

  const totalScores = metrics.map(m => m.consistency + m.pulse)
  const averageScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length
  const trend = totalScores[6] > totalScores[5] ? 'Improving' : 'Declining'
  const needsSupport = metrics.slice(-3).every(m => m.pulse < 1.0)

  return (
    <div className={`backdrop-blur-xl rounded-[2.5rem] p-7 border shadow-2xl relative overflow-hidden group transition-colors duration-300 ${theme === 'dark' ? 'bg-surface/40 border-white/[0.08]' : 'bg-white border-black/[0.05]'}`}>
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Growth Metrics</h3>
          <p className={`text-[10px] font-bold uppercase mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>
            {trend === 'Improving' ? '📈 Trending Up' : '📉 Focus Required'}
          </p>
        </div>
        
        <AnimatePresence>
          {needsSupport && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-nova/10 px-3 py-1.5 rounded-full border border-nova/20 flex items-center gap-2"
            >
              <span className="text-[9px] font-black text-nova uppercase tracking-widest animate-pulse">Talk to Nova?</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex justify-between items-end h-32 gap-3 relative z-10">
        {days.map((day, i) => {
          const m = metrics[i]
          const totalHeight = ((m.consistency + m.pulse) / 5) * 100
          const consistencyHeight = (m.consistency / (m.consistency + m.pulse)) * 100
          
          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center gap-3 h-full group/bar relative"
              onMouseEnter={() => setHoveredDay(i)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className={`w-full flex-1 rounded-2xl overflow-hidden flex flex-col justify-end border transition-colors duration-300 relative ${theme === 'dark' ? 'bg-white/[0.03] border-white/[0.02]' : 'bg-black/[0.03] border-black/[0.02]'}`}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${totalHeight}%` }}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                  className="w-full flex flex-col justify-end overflow-hidden"
                >
                  {/* Recovery Pulse (Purple/Blue) */}
                  <div 
                    className={`w-full bg-gradient-to-t from-nova to-secondary flex-1 transition-all duration-300 ${hoveredDay === i ? 'brightness-125' : ''}`}
                    style={{ height: `${100 - consistencyHeight}%` }}
                  />
                  {/* Consistency (Green) */}
                  <div 
                    className={`w-full bg-gradient-to-t from-primary to-primarySoft transition-all duration-300 ${hoveredDay === i ? 'brightness-125' : ''}`}
                    style={{ height: `${consistencyHeight}%` }}
                  />
                </motion.div>

                {/* Relapse Indicator */}
                {!m.noRelapse && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-panic rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                )}
              </div>
              
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-300 ${hoveredDay === i ? 'text-primary' : (theme === 'dark' ? 'text-textSecondary' : 'text-gray-400')}`}>
                {day}
              </span>

              {/* Tooltip */}
              <AnimatePresence>
                {hoveredDay === i && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className={`absolute bottom-full mb-4 z-50 p-4 rounded-2xl border shadow-2xl min-w-[140px] pointer-events-none transition-colors duration-300 ${theme === 'dark' ? 'bg-surface border-white/10' : 'bg-white border-black/10'}`}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 pb-2 border-b transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 text-textPrimary' : 'border-black/5 text-gray-900'}`}>
                      {day} Breakdown
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-primary uppercase">Consistency</span>
                        <span className={`text-[9px] font-black transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>{m.consistency.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-nova uppercase">Recovery Pulse</span>
                        <span className={`text-[9px] font-black transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>{m.pulse.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 pt-1 border-t border-white/5">
                        <p className={`text-[8px] font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>
                          Mood: <span className="text-primary font-black uppercase">{m.mood}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {/* Encouraging Message Footer */}
      <div className="mt-6 pt-4 border-t border-white/[0.03]">
        <p className={`text-[10px] font-medium leading-relaxed italic transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>
          {!metrics[metrics.length-1].noRelapse 
            ? "A slip is a lesson, not a loss. Your foundation is still there—let's rebuild together."
            : "Your recovery pulse is stabilizing. Keep choosing yourself, one small win at a time."}
        </p>
      </div>
    </div>
  )
}

export const AIPreviewCard = ({ onAction }) => {
  return (
    <div className="bg-gradient-to-br from-nova/40 to-surface/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/[0.08] relative overflow-hidden group shadow-2xl">
      {/* Background Illustration */}
      <div className="absolute -top-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none duration-700">
        <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10M12 22a10 10 0 0 1-10-10" opacity="0.5"/>
          <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.2" className="animate-pulse" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-nova/20 flex items-center justify-center text-3xl shadow-inner backdrop-blur-xl border border-nova/20 group-hover:scale-110 transition-transform duration-500">
            🤖
          </div>
          <div>
            <h3 className="text-base font-black text-textPrimary uppercase tracking-widest leading-none">Nova</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-glow" />
              <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest leading-none">Always Listening</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/5 mb-8">
          <p className="text-sm text-textSecondary leading-relaxed font-medium italic">
            "I'm here to listen without judgment. Tell me what's on your mind today."
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.9)' }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="w-full py-5 bg-white text-backgroundDeep rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all"
        >
          Talk to Nova
        </motion.button>
      </div>
    </div>
  )
}

export const QuoteCard = () => {
  return (
    <div className="bg-surface2 rounded-[2rem] p-8 border border-white/[0.05] text-center relative overflow-hidden group shadow-lg">
      <div className="relative z-10">
        <span className="text-4xl block mb-4 opacity-20 group-hover:opacity-40 transition-opacity text-primary">“</span>
        <p className="text-base font-bold text-textPrimary italic leading-relaxed tracking-tight">
          It does not matter how slowly you go as long as you do not stop.
        </p>
        <div className="w-10 h-1 bg-primary/20 mx-auto my-6 rounded-full" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-textSecondary opacity-60">— Confucius</p>
      </div>
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  )
}

export const CommunityFeed = ({ posts = [], onViewAll }) => {
  const defaultPosts = [
    {
      id: 1,
      author: 'Anonymous Hero',
      content: 'Just hit 30 days today! Never thought I could make it this far. To anyone struggling: it gets easier.',
      likes: 24,
      comments: 5,
      time: '2h ago',
      tags: ['Milestone', 'Motivation']
    },
    {
      id: 2,
      author: 'Fellow Traveler',
      content: 'Having a rough night. The urges are strong but I am stronger. Staying busy with some reading.',
      likes: 12,
      comments: 8,
      time: '4h ago',
      tags: ['Struggling']
    }
  ]

  const displayPosts = posts.length > 0 ? posts : defaultPosts

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-textPrimary">You're not alone</h3>
          <div className="w-1 h-1 bg-community rounded-full animate-pulse" />
        </div>
        <button 
          onClick={onViewAll}
          className="text-[10px] font-black text-community uppercase tracking-widest hover:underline"
        >
          View All
        </button>
      </div>
      
      {displayPosts.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/[0.08] shadow-xl hover:border-community/30 transition-all group relative overflow-hidden"
        >
          {/* Background Illustration */}
          <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-community/20 to-surface2 flex items-center justify-center border border-community/20">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <p className="text-xs font-black text-textPrimary uppercase tracking-tight">{post.author}</p>
                <p className="text-[9px] font-bold text-textSecondary uppercase tracking-widest mt-0.5">{post.time}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-community/10 rounded-full text-community border border-community/20">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          <p className="text-sm text-textSecondary leading-relaxed font-medium mb-6 relative z-10 italic">
            "{post.content}"
          </p>
          
          <div className="flex items-center gap-6 border-t border-white/[0.03] pt-4 relative z-10">
            <button className="flex items-center gap-2 group/btn">
              <span className="text-base group-hover/btn:scale-120 transition-transform">🔥</span>
              <span className="text-[10px] font-black text-textSecondary group-hover/btn:text-primary transition-colors">{post.likes}</span>
            </button>
            <button className="flex items-center gap-2 group/btn">
              <span className="text-base group-hover/btn:scale-120 transition-transform">💬</span>
              <span className="text-[10px] font-black text-textSecondary group-hover/btn:text-textPrimary transition-colors">{post.comments}</span>
            </button>
            <button className="ml-auto text-lg opacity-40 hover:opacity-100 transition-opacity">
              🔖
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
