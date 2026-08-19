import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell, Topbar } from '../components/Shell'
import { useNavigate } from 'react-router-dom'

export default function JournalPage() {
  const { session } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [isWriting, setIsWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('Neutral')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const moods = [
    { icon: '😊', label: 'Great', color: 'primary' },
    { icon: '😐', label: 'Neutral', color: 'nova' },
    { icon: '😔', label: 'Struggling', color: 'secondary' },
    { icon: '😡', label: 'Angry', color: 'panic' },
    { icon: '😴', label: 'Tired', color: 'nova' },
  ]

  useEffect(() => {
    loadEntries()
  }, [session])

  async function loadEntries() {
    if (!session?.user) return
    try {
      setLoading(true)
      setLoadError(null)
      if (!supabase) throw new Error('Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.')
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      console.error('Journal load error:', err.message)
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!content.trim() || !session?.user) return
    setSaving(true)
    setSaveError(null)
    try {
      if (!supabase) throw new Error('Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.')
      const { error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: session.user.id,
          title: title.trim() || 'Untitled',
          content: content.trim(),
          mood,
        })
      if (error) throw error
      setTitle(''); setContent(''); setMood('Neutral'); setIsWriting(false)
      await loadEntries()
    } catch (err) {
      console.error('Journal save error:', err.message)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <AppShell>
      <div className="flex-1 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full shadow-glow" />
      </div>
    </AppShell>
  )

  return (
    <AppShell>
      <Topbar />

      <main className="space-y-12">
        {loadError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl p-5 border border-panic/30 bg-panic/10`}>
            <p className={`text-[10px] font-black uppercase tracking-widest text-panic mb-2`}>⚠️ Failed to load entries</p>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>{loadError}</p>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-2 flex items-start justify-between">
            <div className="space-y-2">
              <h2 className={`text-5xl font-black tracking-tighter leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Your<br />
                <span className="text-secondary">Journal.</span>
              </h2>
              <div className="text-3xl mt-4">📓</div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsWriting(true)}
              className="px-6 py-4 rounded-2xl bg-secondary/15 text-secondary border border-secondary/20 text-[11px] font-black uppercase tracking-widest hover:bg-secondary/25 transition-colors"
            >
              + New Entry
            </motion.button>
          </div>
          <p className={`text-xl font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
            "What's inside, comes out." Write it down. Leave it here.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isWriting && (
            <motion.section key="write" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className={`rounded-[2.5rem] p-8 border space-y-6 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className="flex justify-between items-center">
                  <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>New Entry</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give this entry a title (optional)..."
                  className={`w-full bg-transparent outline-none text-2xl font-black tracking-tight placeholder:opacity-40 transition-colors duration-300 ${theme === 'dark' ? 'text-white placeholder:text-white' : 'text-gray-900 placeholder:text-gray-500'}`}
                />

                <div className="space-y-3">
                  <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>How are you feeling?</p>
                  <div className="flex gap-3 flex-wrap">
                    {moods.map((m) => {
                      const active = mood === m.label
                      return (
                        <motion.button
                          key={m.label}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setMood(m.label)}
                          className={`px-5 py-3 rounded-2xl border flex items-center gap-2 transition-all ${active ? `bg-${m.color}/15 border-${m.color}/30` : theme === 'dark' ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-black/5 hover:border-black/10'}`}
                        >
                          <span className="text-xl">{m.icon}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${active ? `text-${m.color}` : theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{m.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Let it out. Nobody is judging. Just write..."
                  rows={10}
                  className={`w-full bg-transparent outline-none resize-none text-sm font-medium leading-relaxed placeholder:opacity-40 transition-colors duration-300 ${theme === 'dark' ? 'text-white placeholder:text-white/40' : 'text-gray-700 placeholder:text-gray-500'}`}
                />

                {saveError && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-4 border border-panic/30 bg-panic/10`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest text-panic mb-1`}>⚠️ Couldn't save</p>
                    <p className={`text-xs font-medium ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>{saveError}</p>
                  </motion.div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => { setIsWriting(false); setTitle(''); setContent(''); setMood('Neutral') }}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors border ${theme === 'dark' ? 'text-white/40 border-white/5 hover:bg-white/5' : 'text-gray-500 border-black/5 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving || !content.trim()}
                    className="px-8 py-3 rounded-2xl bg-secondary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-secondary/20 disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : 'Save Entry'}
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 pb-12">
          <div className="flex justify-between items-center">
            <h3 className={`text-sm font-black uppercase tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Past Entries</h3>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{entries.length} total</span>
          </div>

          {entries.length === 0 ? (
            <div className={`rounded-[2rem] p-10 border text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
              <span className="text-5xl block mb-5">📓</span>
              <p className={`text-lg font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Nothing written yet.</p>
              <p className={`text-sm font-medium mt-3 leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Tap "New Entry" above. Even a sentence counts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((e, i) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }} className={`rounded-[2rem] p-7 border space-y-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5 hover:border-white/10' : 'bg-gray-50 border-black/5 hover:border-black/10'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-secondary/10 text-secondary`}>
                        {e.mood || 'Uncategorized'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>
                      {new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {new Date(e.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className={`text-lg font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{e.title}</h4>
                  <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap transition-colors duration-300 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{e.content}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </AppShell>
  )
}
