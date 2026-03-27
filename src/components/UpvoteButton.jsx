import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function UpvoteButton({ postId, initialUpvotes = 0, orientation = 'vertical' }) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUpvote = async (e) => {
    e.stopPropagation() // Prevent triggering post click
    if (hasUpvoted || loading) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('posts')
        .update({ upvotes: upvotes + 1 })
        .eq('id', postId)

      if (error) throw error

      setUpvotes(prev => prev + 1)
      setHasUpvoted(true)
    } catch (err) {
      console.error('Error upvoting:', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (orientation === 'horizontal') {
    return (
      <button
        onClick={handleUpvote}
        disabled={hasUpvoted || loading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all font-bold text-sm ${
          hasUpvoted
            ? 'bg-orange-100 text-orange-600 cursor-default'
            : 'hover:bg-gray-100 text-gray-500 active:scale-95'
        }`}
      >
        <span className={`text-lg ${hasUpvoted ? 'text-orange-600' : 'text-gray-400'}`}>
          {hasUpvoted ? '▲' : '△'}
        </span>
        <span>{upvotes}</span>
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleUpvote}
        disabled={hasUpvoted || loading}
        className={`p-1 rounded transition-all active:scale-125 ${
          hasUpvoted 
            ? 'text-orange-600 cursor-default' 
            : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
        }`}
      >
        <span className="text-xl leading-none">
          {hasUpvoted ? '▲' : '△'}
        </span>
      </button>
      <span className={`text-xs font-black transition-colors ${
        hasUpvoted ? 'text-orange-600' : 'text-gray-700'
      }`}>
        {upvotes}
      </span>
      <button
        disabled
        className="p-1 rounded text-gray-300 cursor-not-allowed opacity-50"
      >
        <span className="text-xl leading-none">▽</span>
      </button>
    </div>
  )
}
