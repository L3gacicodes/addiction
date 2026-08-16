import { useState, useEffect } from 'react'
import { useTheme } from '../App.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell, Topbar } from '../components/Shell'

export default function MindfulnessPage() {
  const { theme } = useTheme()
  const [mode, setMode] = useState(null) // null | 'breath' | 'ground' | 'body'
  const [phase, setPhase] = useState('Inhale')
  const [timer, setTimer] = useState(4)
  const [cycles, setCycles] = useState(0)
  const [groundStep, setGroundStep] = useState(0)

  useEffect(() => {
    if (mode !== 'breath') return
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev > 1) return prev - 1
        if (phase === 'Inhale') { setPhase('Hold'); return 4 }
        if (phase === 'Hold') { setPhase('Exhale'); return 6 }
        setPhase('Inhale')
        setCycles(c => c + 1)
        return 4
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [mode, phase])

  const groundSteps = [
    { label: 'Name 5 things you can SEE', emoji: '👁️', count: 5 },
    { label: 'Name 4 things you can TOUCH', emoji: '✋', count: 4 },
    { label: 'Name 3 things you can HEAR', emoji: '👂', count: 3 },
    { label: 'Name 2 things you can SMELL', emoji: '👃', count: 2 },
    { label: 'Name 1 thing you can TASTE', emoji: '👅', count: 1 },
  ]

  const bodyScans = [
    'Close your eyes and take a slow, deep breath.',
    'Bring awareness to the top of your head. Notice any tension.',
    'Move down to your forehead, eyes, and jaw. Soften them.',
    'Release any tightness in your neck and shoulders.',
    'Relax your arms, hands, and fingers.',
    'Let your chest and belly soften with each exhale.',
    'Release tension from your back and hips.',
    'Relax your thighs, knees, calves, and feet.',
    'Take one final deep breath. You are present. You are safe.',
  ]

  return (
    <AppShell>
      <Topbar />

      <main className="space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="space-y-2">
            <h2 className={`text-5xl font-black tracking-tighter leading-none transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Be here,<br />
              <span className="text-nova">right now.</span>
            </h2>
            <div className="text-3xl mt-4">🧘</div>
          </div>
          <p className={`text-xl font-medium leading-relaxed max-w-md transition-colors duration-300 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>
            Small tools for when things feel too big. Pick one below.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!mode ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 pb-12">
              {[
                { id: 'breath', title: '4-4-6 Breathing', sub: 'Box breath for calm', color: 'primary', emoji: '🌬️', desc: 'Inhale 4s · Hold 4s · Exhale 6s' },
                { id: 'ground', title: '5-4-3-2-1 Grounding', sub: 'Come back to the present', color: 'nova', emoji: '🌳', desc: 'Sight · Touch · Sound · Smell · Taste' },
                { id: 'body', title: 'Body Scan', sub: 'Release tension, step by step', color: 'secondary', emoji: '✨', desc: 'Head to toe in 9 gentle steps' },
              ].map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode(p.id); if (p.id === 'breath') { setPhase('Inhale'); setTimer(4); setCycles(0) } if (p.id === 'ground') setGroundStep(0) }}
                  className={`w-full rounded-[2.5rem] p-8 border text-left transition-all group relative overflow-hidden ${theme === 'dark' ? 'bg-[#0F172A] border-white/5 hover:border-white/10' : 'bg-white border-black/5 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-${p.color}/15 flex items-center justify-center text-4xl border border-${p.color}/20`}>{p.emoji}</div>
                    <div className="flex-1">
                      <p className={`text-lg font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{p.title}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{p.sub}</p>
                      <p className={`text-sm font-medium mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>{p.desc}</p>
                    </div>
                    <span className="text-xl opacity-30 group-hover:opacity-70 group-hover:translate-x-1 transition-all">→</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          ) : mode === 'breath' ? (
            <motion.div key="breath" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-12">
              <button onClick={() => setMode(null)} className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>← All tools</button>

              <div className={`rounded-[3rem] p-12 border relative overflow-hidden text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                <div className="flex flex-col items-center justify-center py-10 space-y-10">
                  <div className="relative flex items-center justify-center">
                    <motion.div animate={{ scale: phase === 'Inhale' ? 1.6 : phase === 'Hold' ? 1.6 : 1, opacity: phase === 'Exhale' ? 0.25 : 0.55 }} transition={{ duration: phase === 'Exhale' ? 6 : 4, ease: 'easeInOut' }} className="absolute w-52 h-52 rounded-full bg-gradient-to-br from-nova/40 to-primary/30 blur-2xl" />
                    <motion.div animate={{ scale: phase === 'Inhale' ? 1.5 : phase === 'Hold' ? 1.5 : 1 }} transition={{ duration: phase === 'Exhale' ? 6 : 4, ease: 'easeInOut' }} className={`w-44 h-44 rounded-full flex items-center justify-center border-2 relative ${theme === 'dark' ? 'bg-[#020617] border-nova/40' : 'bg-white border-nova/30'}`}>
                      <div className="text-center">
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors duration-300 ${theme === 'dark' ? 'text-nova' : 'text-nova'}`}>{phase}</p>
                        <p className={`text-6xl font-black mt-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{timer}</p>
                      </div>
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <p className={`text-base font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cycles completed</p>
                    <p className="text-4xl font-black text-primary">{cycles}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : mode === 'ground' ? (
            <motion.div key="ground" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-12">
              <button onClick={() => setMode(null)} className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>← All tools</button>

              <div className="space-y-4">
                {groundSteps.map((s, i) => {
                  const isActive = i === groundStep
                  const isDone = i < groundStep
                  return (
                    <motion.button
                      key={i}
                      onClick={() => isActive && setGroundStep(i + 1)}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      whileTap={isActive ? { scale: 0.98 } : {}}
                      disabled={!isActive && !isDone}
                      className={`w-full rounded-[2rem] p-6 border text-left flex items-center gap-5 transition-all relative ${isActive ? (theme === 'dark' ? 'bg-nova/10 border-nova/30 shadow-[0_0_40px_rgba(139,92,246,0.15)]' : 'bg-nova/5 border-nova/20 shadow-md') : (theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5')} ${isDone ? 'opacity-40' : ''}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isActive ? 'bg-nova/20' : 'bg-primary/10'}`}>{s.emoji}</div>
                      <div className="flex-1">
                        <p className={`text-sm font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{s.label}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 transition-colors duration-300 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`}>{s.count} items</p>
                      </div>
                      <span className={`text-xl ${isDone ? 'text-primary' : isActive ? 'text-nova animate-pulse' : 'text-white/10'}`}>{isDone ? '✓' : isActive ? '→' : '○'}</span>
                    </motion.button>
                  )
                })}

                {groundStep === groundSteps.length && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-[2.5rem] p-10 border text-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-primary/20' : 'bg-primary/5 border-primary/10'}`}>
                    <span className="text-5xl block mb-5">🌳</span>
                    <p className={`text-xl font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>You did it.</p>
                    <p className={`text-sm font-medium mt-3 leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>You're grounded in the present moment. Take this calm with you.</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="body" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-8 pb-12">
              <button onClick={() => setMode(null)} className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-white/40 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>← All tools</button>
              <div className="space-y-3">
                {bodyScans.map((step, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }} className={`rounded-[2rem] p-6 border flex items-start gap-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] border-white/5' : 'bg-gray-50 border-black/5'}`}>
                    <span className={`text-[11px] font-black mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-secondary/15 text-secondary' : 'bg-secondary/10 text-secondary'}`}>{i + 1}</span>
                    <p className={`text-sm font-medium leading-relaxed transition-colors duration-300 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{step}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </AppShell>
  )
}
