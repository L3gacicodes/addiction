import { motion } from 'framer-motion'

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-primary hover:bg-primaryDark text-white shadow-soft rounded-2xl',
    secondary: 'bg-secondary hover:bg-secondaryLight text-white rounded-xl',
    danger: 'bg-danger text-white rounded-2xl shadow-soft animate-pulse-slow',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`px-6 py-3 font-bold transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

export const Card = ({ children, title, className = '', ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-backgroundDeep rounded-2xl p-6 shadow-soft border border-slate-800/50 ${className}`}
      {...props}
    >
      {title && <h3 className="text-xl font-bold text-textPrimary mb-4">{title}</h3>}
      <div className="text-textSecondary leading-relaxed">
        {children}
      </div>
    </motion.div>
  )
}

export const Heading = ({ children, className = '' }) => (
  <h1 className={`text-3xl md:text-4xl font-black text-textPrimary tracking-tight ${className}`}>
    {children}
  </h1>
)

export const Subheading = ({ children, className = '' }) => (
  <h2 className={`text-lg md:text-xl font-semibold text-textSecondary uppercase tracking-[0.2em] ${className}`}>
    {children}
  </h2>
)

export const Layout = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-background text-textPrimary p-6 md:p-10 font-sans ${className}`}>
      <div className="max-w-5xl mx-auto w-full">
        {children}
      </div>
    </div>
  )
}
