import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App'

export default function CreatePost({ onPostCreated, onCancel }) {
  const { session } = useAuth()
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

      // Show toast
      setShowToast(true)
      
      // Clear form
      setTitle('')
      setContent('')

      // Wait a bit for the toast to be seen before closing or refreshing
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
    <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-green-600 text-white px-6 py-2 rounded-full shadow-lg font-bold flex items-center gap-2">
            <span>✅</span> Post shared anonymously
          </div>
        </div>
      )}

      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Create an anonymous post</h2>
        <button 
          onClick={onCancel} 
          className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="What's on your mind?"
            className="w-full text-xl font-bold border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-400 transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            placeholder="Share your experience, struggle, or victory..."
            rows="8"
            className="w-full border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-400 transition-all"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-8 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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
          </button>
        </div>
      </form>
    </div>
  )
}
