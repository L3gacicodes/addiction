import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useTheme, useAuth } from '../App'
import { sendNovaMessage, NOVA_QUICK_ACTIONS, errorMessageFromCode } from '../lib/nova'

export const Modal = ({ isOpen, onClose, children, title, subtitle, fullHeight = false }) => {
  const { theme } = useTheme()
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 backdrop-blur-xl transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/60' : 'bg-gray-900/40'}`}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative w-full max-w-mobile rounded-t-[3.5rem] sm:rounded-[3rem] border-t shadow-[0_-20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col transition-all duration-300 ${fullHeight ? 'h-[94vh]' : 'max-h-[92vh]'} ${theme === 'dark' ? 'bg-surface/80 border-white/10 backdrop-blur-2xl' : 'bg-white border-black/5'}`}
          >
            {/* Header Handle for Mobile */}
            <div className={`w-12 h-1.5 rounded-full mx-auto mt-5 mb-2 sm:hidden flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`} />
            
            <div className="flex-1 flex flex-col min-h-0">
              <div className={`px-8 pt-6 pb-4 flex justify-between items-center border-b transition-colors duration-300 ${theme === 'dark' ? 'border-white/[0.03]' : 'border-black/[0.03]'}`}>
                <div>
                  <h2 className={`text-xl font-black uppercase tracking-tight leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>{title}</h2>
                  {subtitle && <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>{subtitle}</p>}
                </div>
                <button 
                  onClick={onClose} 
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all border active:scale-90 ${theme === 'dark' ? 'bg-white/5 text-textSecondary hover:text-textPrimary border-white/5' : 'bg-gray-100 text-gray-400 hover:text-gray-900 border-black/5'}`}
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

export const StrongModal = ({ isOpen, onClose, streak }) => {
  const { theme } = useTheme()
  return (
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
          <h3 className={`text-3xl font-black uppercase tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Day {streak} Complete!</h3>
          <p className={`text-base font-medium mt-3 leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>
            Your tree is growing stronger. You've successfully resisted urges today.
          </p>
        </div>
        <div className={`backdrop-blur-xl rounded-3xl p-6 border text-left relative overflow-hidden group transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/50 border-white/5' : 'bg-gray-50 border-black/5 shadow-inner'}`}>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse" />
              Recovery Insight
            </p>
            <p className={`text-sm leading-relaxed italic font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>
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
}

export const RelapseModal = ({ isOpen, onClose, onConfirm }) => {
  const { theme } = useTheme()
  return (
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
          <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>It's okay to start again</h3>
          <p className={`text-base font-medium mt-3 leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>
            A relapse isn't failure—it's part of the journey. What matters is that you're here now, choosing to restart.
          </p>
        </div>
        <div className="space-y-4 relative z-10">
          <button
            onClick={onConfirm}
            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all hover:bg-red-500 hover:text-white border ${theme === 'dark' ? 'bg-white text-black border-white/10' : 'bg-gray-900 text-white border-black/10'}`}
          >
            Reset Streak & Restart
          </button>
          <button
            onClick={onClose}
            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] transition-colors border ${theme === 'dark' ? 'bg-white/5 text-textSecondary hover:bg-white/10 border-white/5' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-black/5'}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

export const AIChatModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme()
  const { session } = useAuth()
  const [messages, setMessages] = useState([
    { id: 'welcome', role: 'assistant', text: "Hey — I'm Nova. I'm here to listen without judgment. What's on your mind today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryMessage, setRetryMessage] = useState(null)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 30)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, error, isOpen])

  const userToken = useMemo(() => session?.access_token || session?.user?.access_token || null, [session])

  async function sendAndAppend(userText) {
    const text = userText?.trim()
    if (!text || loading) return
    setError(null)
    setRetryMessage(null)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text }])
    setInput('')
    setLoading(true)

    const historyForAPI = messages.slice(-30)
    const result = await sendNovaMessage({ messages: historyForAPI, userMessage: text, userToken })

    if (result.ok) {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: result.message }])
      setLoading(false)
    } else {
      setRetryMessage(text)
      setError({
        code: result.code || 'GEMINI_API_ERROR',
        message: result.error || errorMessageFromCode(result.code),
        debug: result.debug && Object.keys(result.debug).length ? result.debug : null,
        status: result.status || 0,
      })
      setLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim() || loading) return
    sendAndAppend(input)
  }

  const handleQuickAction = (label) => sendAndAppend(label)
  const showQuickActions = messages.length <= 2 && !loading && !error

  const surface2Classes = theme === 'dark' ? 'bg-surface2 text-textPrimary border border-white/5' : 'bg-gray-50 text-gray-800 border border-black/5'
  const userBubbleClasses = theme === 'dark' ? 'bg-primary text-white' : 'bg-primary text-white'
  const surfacePanel = theme === 'dark' ? 'bg-backgroundDeep/80 backdrop-blur-xl border-white/[0.05]' : 'bg-white border-black/5'
  const dotStyle = { background: theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Talk to Nova" subtitle="Your recovery companion" fullHeight>
      <div className="flex flex-col h-full -mx-8 -my-6">
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-lg whitespace-pre-wrap ${
                  msg.role === 'user' ? `${userBubbleClasses} rounded-tr-none` : `${surface2Classes} rounded-tl-none`
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                <div className={`${surface2Classes} rounded-[2rem] rounded-tl-none px-5 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full" style={dotStyle} />
                      <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.18 }} className="w-1.5 h-1.5 rounded-full" style={dotStyle} />
                      <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.36 }} className="w-1.5 h-1.5 rounded-full" style={dotStyle} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Nova is thinking…</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className={`rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${theme === 'dark' ? 'bg-panic/10 border border-panic/20' : 'bg-red-50 border border-red-100'}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${theme === 'dark' ? 'bg-panic/20' : 'bg-red-100'}`}>⚠️</div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-panic' : 'text-red-500'}`}>{error.code || 'NOVA_ERROR'}{error.status ? ` · HTTP ${error.status}` : ''}</p>
                    <p className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-white/80' : 'text-red-700'}`}>{error.message}</p>
                    {error.debug && import.meta.env.DEV && (
                      <div className="mt-3 p-3 rounded-xl bg-black/90 text-white text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-all select-all border border-red-500/40">
{`GEMINI DEBUG (DEV ONLY)
model     : ${error.debug.model || '—'}
status    : ${error.debug.status ?? '—'}
code      : ${error.debug.code || '—'}
geminiCode: ${error.debug.geminiCode || '—'}
attempts  : ${error.debug.attempts || 1}
duration  : ${error.debug.durationMs ?? '—'} ms
message   : ${error.debug.message || '—'}`}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => retryMessage && sendAndAppend(retryMessage)}
                    disabled={loading || !retryMessage}
                    className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 flex-shrink-0 ${theme === 'dark' ? 'bg-panic hover:brightness-110' : 'bg-red-600 hover:bg-red-500'}`}
                  >
                    Try again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showQuickActions && (
            <div className="space-y-2 pt-1">
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>Start with one of these</p>
              <div className="flex flex-wrap gap-2">
                {NOVA_QUICK_ACTIONS.slice(0, 5).map((a) => (
                  <motion.button
                    key={a.key}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    onClick={() => handleQuickAction(a.label)}
                    disabled={loading}
                    className={`px-3.5 py-2 rounded-2xl border text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors ${theme === 'dark' ? 'bg-white/5 border-white/10 hover:border-nova/30 text-white/80' : 'bg-white border-black/5 hover:border-nova/30 text-gray-700'}`}
                  >
                    <span>{a.emoji}</span><span>{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className={`p-6 border-t ${surfacePanel}`}>
          <div className={`flex gap-3 bg-surface rounded-[1.5rem] p-2 border shadow-inner ${theme === 'dark' ? 'bg-surface border-white/10' : 'bg-gray-100 border-black/5'}`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your thoughts..."
              disabled={loading}
              className="flex-1 bg-transparent px-4 py-2 text-textPrimary placeholder:text-textSecondary/50 outline-none text-sm disabled:opacity-50"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-glow active:scale-90 disabled:opacity-40"
            >
              {loading ? '···' : '↗️'}
            </motion.button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
