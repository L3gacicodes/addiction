import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import MotivationalMessages from '../components/MotivationalMessages'

export default function PanicPage() {
  const navigate = useNavigate()
  const [showQuiz, setShowQuiz] = useState(false)
  const [breathingPhase, setBreathingPhase] = useState('Inhale')
  const [timer, setTimer] = useState(4)

  // Breathing logic: 4s Inhale, 4s Hold, 6s Exhale
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev > 1) return prev - 1
        
        if (breathingPhase === 'Inhale') {
          setBreathingPhase('Hold')
          return 4
        } else if (breathingPhase === 'Hold') {
          setBreathingPhase('Exhale')
          return 6
        } else {
          setBreathingPhase('Inhale')
          return 4
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [breathingPhase])

  return (
    <div className="min-h-screen bg-backgroundDeep text-textPrimary flex flex-col items-center justify-between p-8 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-nova/10 via-backgroundDeep to-backgroundDeep -z-10" />

      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center"
      >
        <h1 className="text-xl font-black uppercase tracking-[0.3em] text-nova">Panic Mode</h1>
        <p className="text-textSecondary text-xs font-bold mt-2 tracking-widest uppercase opacity-60">You are safe. You are in control.</p>
      </motion.div>

      {/* Central Breathing Area */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md">
        <div className="relative flex items-center justify-center">
          {/* Animated Circle */}
          <motion.div
            animate={{
              scale: breathingPhase === 'Inhale' ? 1.5 : breathingPhase === 'Hold' ? 1.5 : 1,
              opacity: breathingPhase === 'Exhale' ? 0.3 : 0.6,
            }}
            transition={{ 
              duration: breathingPhase === 'Exhale' ? 6 : 4,
              ease: "easeInOut" 
            }}
            className="w-48 h-48 rounded-full border-2 border-nova/30 bg-nova/10 backdrop-blur-sm"
          />
          
          {/* Inner Text */}
          <div className="absolute flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={breathingPhase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-black uppercase tracking-widest text-textPrimary"
              >
                {breathingPhase}
              </motion.span>
            </AnimatePresence>
            <span className="text-5xl font-mono font-light mt-2 text-textPrimary">{timer}</span>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="mt-16 w-full text-center h-24 flex items-center justify-center px-4">
          <MotivationalMessages />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowQuiz(!showQuiz)}
          className="py-4 rounded-2xl bg-surface/40 border border-white/[0.08] text-textSecondary font-bold uppercase tracking-widest text-xs hover:bg-surface/60 transition-colors shadow-lg"
        >
          {showQuiz ? 'Close Distraction' : 'Try Distraction'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard')}
          className="py-4 rounded-2xl bg-nova text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-nova/20 active:bg-novaDark"
        >
          I'm Feeling Better
        </motion.button>
      </div>

      {/* Simple Distraction Overlay */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-backgroundDeep/90 backdrop-blur-xl flex flex-col items-center justify-center p-8"
          >
            <h2 className="text-2xl font-black mb-8 text-nova uppercase tracking-widest">Quick Focus</h2>
            <div className="bg-surface p-8 rounded-3xl border border-white/5 w-full max-w-sm text-center shadow-2xl">
              <p className="text-textPrimary text-lg mb-6 font-medium italic leading-relaxed">Count backward from 100 by 7s</p>
              <button 
                onClick={() => setShowQuiz(false)}
                className="w-full py-4 rounded-xl bg-nova text-white font-black uppercase tracking-widest text-xs shadow-lg"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
