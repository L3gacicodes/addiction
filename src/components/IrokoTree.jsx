import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const STAGES = [
  { name: 'Seed', min: 0, scale: 0.4, color: '#166534', icon: '🌱' },
  { name: 'Sprout', min: 4, scale: 0.6, color: '#15803d', icon: '🌿' },
  { name: 'Sapling', min: 8, scale: 0.8, color: '#16a34a', icon: '🪴' },
  { name: 'Young Tree', min: 15, scale: 1.0, color: '#22c55e', icon: '🌳' },
  { name: 'Mature Iroko', min: 30, scale: 1.3, color: '#4ade80', icon: '🌲' }
]

export default function IrokoTree({ streak }) {
  const [stage, setStage] = useState(STAGES[0])
  const [isLevelingUp, setIsLevelingUp] = useState(false)

  useEffect(() => {
    const newStage = [...STAGES].reverse().find(s => streak >= s.min) || STAGES[0]
    if (newStage.name !== stage.name) {
      setIsLevelingUp(true)
      setTimeout(() => setIsLevelingUp(false), 3000)
    }
    setStage(newStage)
  }, [streak])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-[2rem] p-5 border border-white/[0.05] shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between min-h-[160px]"
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -mr-4 -mt-4" />
      <div className="absolute bottom-0 left-0 w-12 h-12 bg-primary/5 rounded-full blur-xl -ml-4 -mb-4" />

      <div className="relative z-10 flex flex-col items-center h-full justify-between">
        {/* Header */}
        <div className="w-full flex justify-between items-center">
          <div>
            <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-textPrimary leading-none">Signature Tree</h3>
            <p className="text-[7px] font-bold text-textSecondary uppercase mt-0.5 tracking-widest">Growth</p>
          </div>
          <div className="px-1.5 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-[7px] font-black text-primary uppercase tracking-widest leading-none">{stage.name}</span>
          </div>
        </div>

        {/* Tree Visual Container */}
        <div className="relative w-24 h-24 flex items-center justify-center my-1">
          {/* Level Up Pulse */}
          <AnimatePresence>
            {isLevelingUp && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
              />
            )}
          </AnimatePresence>

          {/* Tree SVG */}
          <motion.div
            animate={{ 
              rotate: [0, 1.5, 0, -1.5, 0],
              scale: stage.scale * 0.65 
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" },
              scale: { type: "spring", stiffness: 100, damping: 15 }
            }}
            className="relative"
          >
            <svg width="100" height="100" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Trunk */}
              <path d="M80 140V100" stroke="#3F2E2E" strokeWidth="8" strokeLinecap="round"/>
              <path d="M80 115L65 100" stroke="#3F2E2E" strokeWidth="6" strokeLinecap="round"/>
              <path d="M80 125L95 110" stroke="#3F2E2E" strokeWidth="6" strokeLinecap="round"/>
              
              {/* Canopy with Gradients */}
              <defs>
                <radialGradient id="treeGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={stage.color} />
                  <stop offset="100%" stopColor="#064e3b" />
                </radialGradient>
              </defs>

              <motion.g
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <circle cx="80" cy="75" r="35" fill="url(#treeGradient)" className="opacity-90 shadow-glow" />
                <circle cx="60" cy="65" r="25" fill="url(#treeGradient)" className="opacity-80" />
                <circle cx="100" cy="65" r="25" fill="url(#treeGradient)" className="opacity-80" />
                <circle cx="80" cy="45" r="20" fill="url(#treeGradient)" className="opacity-90 shadow-glow" />
                
                {/* Decorative Dots/Fruits */}
                {streak > 7 && (
                  <>
                    <circle cx="70" cy="60" r="2" fill="#FACC15" className="animate-pulse" />
                    <circle cx="95" cy="75" r="2" fill="#FACC15" className="animate-pulse" />
                    <circle cx="80" cy="40" r="2" fill="#FACC15" className="animate-pulse" />
                  </>
                )}
              </motion.g>
            </svg>
            
            {/* Ground/Shadow */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-black/20 rounded-full blur-sm" />
          </motion.div>
        </div>

        {/* Stats Summary - Simplified */}
        <div className="w-full grid grid-cols-2 gap-1.5">
          <div className="bg-backgroundDeep/50 rounded-lg p-1.5 border border-white/5 flex flex-col items-center">
            <span className="text-[6px] font-black text-textSecondary uppercase tracking-widest leading-none mb-0.5">Vitality</span>
            <span className="text-[8px] font-black text-primary uppercase tracking-tighter leading-none">Strong</span>
          </div>
          <div className="bg-backgroundDeep/50 rounded-lg p-1.5 border border-white/5 flex flex-col items-center">
            <span className="text-[6px] font-black text-textSecondary uppercase tracking-widest leading-none mb-0.5">Status</span>
            <span className="text-[8px] font-black text-textPrimary uppercase tracking-tighter leading-none">Growing</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
