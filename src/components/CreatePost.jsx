import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App'
import { motion } from 'framer-motion'

export default function CreatePost({ onPostCreated, onCancel }) {
  const { session } = useAuth()
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('posts').insert([
        {
          title: title.trim(),
          content: content.trim(),
          user_id: session.user.id,
        },
      ])

      if (error) throw error

      setShowToast(true)
      
      setTitle('')
      setContent('')

      setTimeout(() => {
        setShowToast(false)
        if (onPostCreated) onPostCreated()
      }, 2000)

    } catch (err) {
      alert('Error creating post: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative transition-colors duration-300 ${theme === 'dark' ? 'bg-surface text-textPrimary border border-white/5' : 'bg-white text-gray-900'}`}>
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-primary text-white px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-2 text-white">
            <span>✅</span> Post shared anonymously
          </div>
        </div>
      )}

      <div className={`p-4 border-b flex justify-between items-center transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 bg-backgroundDeep/50' : 'border-gray-200 bg-gray-50'}`}>
        <h2 className={`text-lg font-bold transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-800'}`}>Create an anonymous post</h2>
        <button 
          onClick={onCancel} 
          className={`text-2xl transition-colors transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary hover:text-textPrimary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="title" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-700'}`}>
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="What's on your mind?"
            className={`w-full text-xl font-bold rounded-lg p-3 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none placeholder-opacity-40 transition-all transition-colors duration-300 ${theme === 'dark'
              ? 'bg-backgroundDeep border border-white/10 text-textPrimary placeholder:text-textSecondary/50'
              : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="content" className={`block text-sm font-medium mb-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-700'}`}>
            Content
          </label>
          <textarea
            id="content"
            placeholder="Share your experience, struggle, or victory..."
            rows="8"
            className={`w-full rounded-lg p-3 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none resize-none placeholder-opacity-40 transition-all transition-colors duration-300 ${theme === 'dark'
              ? 'bg-backgroundDeep border border-white/10 text-textPrimary placeholder:text-textSecondary/50'
              : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400'
            }`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        <div className={`flex justify-end pt-4 border-t gap-3 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-2 rounded-full border font-bold hover:bg-black/5 transition-colors transition-colors duration-300 ${theme === 'dark'
              ? 'border-white/10 text-textSecondary hover:bg-white/5 hover:text-textPrimary'
              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-8 py-2 rounded-full bg-secondary text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Posting...
              </span>
            ) : (
              'Post Anonymously'
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}
