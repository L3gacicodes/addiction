import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../App'
import { Link } from 'react-router-dom'

export default function AITherapistPage() {
  const { session } = useAuth()
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello. I'm your recovery companion. I'm here to listen, support you, and help you navigate any urges or stress you're feeling. How are you doing right now?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const sendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text })
      })

      console.log('AI Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json()
      
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.reply || "I'm here to listen. Tell me more about that.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      console.error('AI Error:', error)
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I'm having a little trouble connecting right now. Take a deep breath—I'm still here with you. Try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
            ←
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              AI Therapist <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compassionate Recovery Support</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] md:max-w-[70%] rounded-3xl px-5 py-3 shadow-sm ${
                msg.sender === 'ai' 
                  ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' 
                  : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100'
              }`}>
                <p className="text-sm md:text-base leading-relaxed font-medium">
                  {msg.text}
                </p>
                <p className={`text-[10px] mt-1 font-bold uppercase tracking-widest opacity-50 ${
                  msg.sender === 'ai' ? 'text-slate-400' : 'text-indigo-200'
                }`}>
                  {msg.timestamp}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-100 rounded-3xl rounded-tl-none px-5 py-4 flex gap-1">
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-100 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <form onSubmit={sendMessage} className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 pr-14 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              ↑
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">
          Your conversation is private & secure
        </p>
      </footer>
    </div>
  )
}
