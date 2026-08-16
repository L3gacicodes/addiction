import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../App'
import { Link } from 'react-router-dom'
import { sendNovaMessage, NOVA_QUICK_ACTIONS, errorMessageFromCode } from '../lib/nova'

export default function AITherapistPage() {
  const { session } = useAuth()

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hey — I'm Nova. Your recovery companion.

I'm not a doctor or therapist, but I'm here whenever you need to talk through a craving, a trigger, a setback, or just what's on your mind.

What's coming up for you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) // { code, message }
  const [retryMessage, setRetryMessage] = useState(null) // last user msg for retry
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 30)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, error])

  const userToken = useMemo(() => session?.access_token || session?.user?.access_token || null, [session])

  async function sendAndAppend(userText) {
    const text = userText?.trim()
    if (!text || loading) return
    setError(null)
    setRetryMessage(null)

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // send history excluding the welcome-only tail if it's just the intro:
    // Use all messages except the one we just added as conversation history
    const historyForAPI = messages.slice(-30)

    const result = await sendNovaMessage({
      messages: historyForAPI,
      userMessage: text,
      userToken,
    })

    if (result.ok) {
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
      setLoading(false)
    } else {
      setRetryMessage(text)
      setError({ code: result.code || 'GEMINI_API_ERROR', message: result.error || errorMessageFromCode(result.code) })
      setLoading(false)
    }
  }

  async function handleRetry() {
    if (!retryMessage || loading) return
    sendAndAppend(retryMessage)
  }

  function handleQuickAction(action) {
    const text = typeof action === 'string' ? action : action.label
    sendAndAppend(text)
  }

  const onSubmit = (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    sendAndAppend(input)
  }

  const showQuickActions = messages.length <= 2 && !loading && !error

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#020617] overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 dark:text-white/50">
            ←
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500/20 via-nova/20 to-primary/20 flex items-center justify-center text-2xl border border-nova/20 shadow-inner">
              🤖
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Nova
                <span className="relative inline-flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                Your recovery companion
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-gradient-to-b from-slate-50 to-white dark:from-[#020617] dark:to-[#020617]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[88%] md:max-w-[70%] shadow-sm ${
                msg.role === 'assistant'
                  ? 'bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-white/5 text-slate-800 dark:text-white/90 rounded-3xl rounded-tl-none'
                  : 'bg-gradient-to-br from-primary to-nova text-white rounded-3xl rounded-tr-none shadow-lg shadow-primary/20'
              }`}>
                <div className="px-5 py-3">
                  <p className="text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest opacity-50 ${
                    msg.role === 'assistant' ? 'text-slate-400 dark:text-white/40' : 'text-white/70'
                  }`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-white/5 rounded-3xl rounded-tl-none px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full" />
                    <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.18 }} className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full" />
                    <motion.span animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.36 }} className="w-1.5 h-1.5 bg-slate-400 dark:bg-white/40 rounded-full" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/50">
                    Nova is thinking…
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error / Retry */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-xl mx-auto"
            >
              <div className="rounded-2xl border border-red-100 dark:border-panic/20 bg-red-50 dark:bg-panic/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-panic/20 flex items-center justify-center text-2xl flex-shrink-0">⚠️</div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-panic">{error.code || 'NOVA_ERROR'}</p>
                  <p className="text-sm font-medium text-red-700 dark:text-white/80 mt-1">{error.message}</p>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={loading || !retryMessage}
                  className="px-5 py-3 rounded-xl bg-red-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-500 active:scale-95 transition-all disabled:active:scale-100 flex-shrink-0"
                >
                  Try again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={chatEndRef} />
      </main>

      {/* Quick actions (above input, shows at start or when empty) */}
      {showQuickActions && (
        <div className="px-4 md:px-6 pt-2">
          <div className="max-w-4xl mx-auto space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 px-2">
              Start with one of these
            </p>
            <div className="flex flex-wrap gap-2">
              {NOVA_QUICK_ACTIONS.map((a) => (
                <motion.button
                  key={a.key}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleQuickAction(a)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 hover:border-nova/30 dark:hover:border-nova/30 text-sm font-medium text-slate-700 dark:text-white/80 flex items-center gap-2 transition-colors"
                >
                  <span>{a.emoji}</span>
                  <span className="text-[13px]">{a.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="bg-white dark:bg-[#0F172A] border-t border-slate-100 dark:border-white/5 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <form onSubmit={onSubmit} className="flex-1 relative">
            <div className="flex gap-3 items-end bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-2 focus-within:ring-2 focus-within:ring-nova/20 focus-within:border-nova/40 transition-all">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(e) } }}
                placeholder="Tell Nova what's on your mind..."
                disabled={loading}
                className="flex-1 bg-transparent rounded-2xl px-4 py-3 resize-none focus:outline-none font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 disabled:opacity-50 text-sm"
                style={{ minHeight: 48, maxHeight: 160 }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex-shrink-0 h-11 px-5 rounded-2xl bg-gradient-to-br from-primary to-nova disabled:opacity-40 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:active:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>···</motion.span>
                ) : (
                  <>
                    Send <span className="text-base leading-none">↗</span>
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="text-center text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">
            Nova is not a replacement for professional care · Your conversation stays private
          </p>
        </div>
      </footer>
    </div>
  )
}
