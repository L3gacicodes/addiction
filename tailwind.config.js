/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        backgroundDeep: '#020617', // bg-main (deep calm)
        surface: '#0F172A',        // bg-surface
        surface2: '#111827',       // bg-card
        surface3: '#1e293b',
        primary: '#22C55E',        // healing green
        primarySoft: '#4ADE80',
        secondary: '#3B82F6',      // calm blue
        secondarySoft: '#60A5FA',
        accent: '#FACC15',         // reward
        textPrimary: '#E2E8F0',    // text-main
        textSecondary: '#94A3B8',  // text-soft
        panic: '#F87171',          // softer red
        
        // Feature Colors
        nova: '#6366F1',           // Nova Blue/Purple
        community: '#14B8A6',      // Teal
      },
      spacing: {
        'section': '16px',
        'card': '20px',
        'inner': '12px',
      },
    maxWidth: {
        'mobile': '430px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
