import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'

export const Modal = ({ isOpen, onClose, children, title, subtitle, fullHeight = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-backgroundDeep/60 backdrop-blur-xl"
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative w-full max-w-mobile bg-surface/80 backdrop-blur-2xl rounded-t-[3.5rem] sm:rounded-[3rem] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ${fullHeight ? 'h-[94vh]' : 'max-h-[92vh]'}`}
          >
            {/* Header Handle for Mobile */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-5 mb-2 sm:hidden flex-shrink-0" />
            
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-8 pt-6 pb-4 flex justify-between items-center border-b border-white/[0.03]">
                <div>
                  <h2 className="text-xl font-black text-textPrimary uppercase tracking-tight leading-none">{title}</h2>
                  {subtitle && <p className="text-[10px] font-bold text-textSecondary uppercase tracking-widest mt-1">{subtitle}</p>}
                </div>
                <button 
                  onClick={onClose} 
                  className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-textSecondary hover:text-textPrimary transition-all border border-white/5 active:scale-90"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-8 py-6">
                  {children}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export const StrongModal = ({ isOpen, onClose, streak }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="I stayed strong today" subtitle="Daily Milestone Reached">
    <div className="text-center space-y-8">
      <div className="relative">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="w-28 h-28 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto text-6xl shadow-glow relative z-10"
        >
          🔥
        </motion.div>
        <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full" />
      </div>
      <div>
        <h3 className="text-3xl font-black text-textPrimary uppercase tracking-tighter">Day {streak} Complete!</h3>
        <p className="text-textSecondary text-base font-medium mt-3 leading-relaxed">
          Your tree is growing stronger. You've successfully resisted urges today.
        </p>
      </div>
      <div className="bg-backgroundDeep/50 backdrop-blur-xl rounded-3xl p-6 border border-white/5 text-left relative overflow-hidden group">
        <div className="relative z-10">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
            Recovery Insight
          </p>
          <p className="text-sm text-textSecondary leading-relaxed italic font-medium">
            "Consistency is the playground of excellence." You're building a new life, one day at a time.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl" />
      </div>
      <button
        onClick={onClose}
        className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-95 transition-all hover:bg-primaryDark"
      >
        Keep Going
      </button>
    </div>
  </Modal>
)

export const RelapseModal = ({ isOpen, onClose, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="I slipped — help me reset" subtitle="Healing isn't linear">
    <div className="text-center space-y-8 relative overflow-hidden">
      {/* Background Illustration */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeWidth="2"/>
        </svg>
      </div>

      <div className="w-24 h-24 bg-panic/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-5xl relative z-10 shadow-inner border border-panic/20">
        🌱
        <div className="absolute inset-0 bg-panic/10 blur-[30px] rounded-full" />
      </div>
      <div className="relative z-10">
        <h3 className="text-2xl font-black text-textPrimary uppercase tracking-tighter">It's okay to start again</h3>
        <p className="text-textSecondary text-base font-medium mt-3 leading-relaxed">
          A relapse isn't failure—it's part of the journey. What matters is that you're here now, choosing to restart.
        </p>
      </div>
      <div className="space-y-4 relative z-10">
        <button
          onClick={onConfirm}
          className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-red-500 hover:text-white border border-white/10"
        >
          Reset Streak & Restart
        </button>
        <button
          onClick={onClose}
          className="w-full py-5 bg-white/5 text-textSecondary rounded-[1.5rem] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-colors border border-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  </Modal>
)

export const AIChatModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello. I'm your AI companion. I'm here to listen without judgment. How are you feeling today?" }
  ])
  const [input, setInput] = useState('')
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userText = input.trim()
    setMessages(prev => [...prev, { role: 'user', text: userText }])
    setInput('')
    setLoading(true)
    
    try {
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      })

      console.log('AI Support Modal Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Support Modal Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.reply || "I understand. Recovery is a journey. How can I help you through this?" 
      }])
    } catch (error) {
      console.error('AI Support Error:', error)
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "I'm having trouble connecting right now, but I'm still here for you. Take a deep breath." 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Support" subtitle="Always here for you" fullHeight>
      <div className="flex flex-col h-full -mx-8 -my-6">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-surface2 text-textPrimary border border-white/5 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-6 bg-backgroundDeep/80 backdrop-blur-xl border-t border-white/[0.05]">
          <div className="flex gap-3 bg-surface rounded-[1.5rem] p-2 border border-white/10 shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your thoughts..."
              className="flex-1 bg-transparent px-4 py-2 text-textPrimary placeholder:text-textSecondary/50 outline-none text-sm"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-glow active:scale-90"
            >
              ↗️
            </motion.button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
