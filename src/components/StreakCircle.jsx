import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function StreakCircle({ streak, maxStreak = 30 }) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    // Calculate progress percentage, capped at 100
    const percentage = Math.min((streak / maxStreak) * 100, 100)
    setProgress(percentage)
  }, [streak, maxStreak])

  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center relative w-64 h-64 mx-auto">
      {/* Background Circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="128"
          cy="128"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="128"
          cy="128"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-green-500"
          strokeLinecap="round"
        />
      </svg>

      {/* Inner Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black text-gray-900"
        >
          {streak}
        </motion.span>
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
          {streak === 1 ? 'Day' : 'Days'}
        </span>
        <span className="text-xs font-medium text-gray-400 mt-1 italic">
          Current Streak
        </span>
      </div>

      {/* Glow Effect */}
      <div className="absolute inset-0 bg-green-400 rounded-full filter blur-3xl opacity-10 -z-10 animate-pulse"></div>
    </div>
  )
}
