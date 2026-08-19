import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App'
import { motion } from 'framer-motion'
import UpvoteButton from './UpvoteButton'

export default function PostDetail({ postId, onClose, onCommentAdded }) {
  const { session } = useAuth()
  const { theme } = useTheme()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (postId) {
      fetchPostAndComments()
    }
  }, [postId])

  async function fetchPostAndComments() {
    try {
      setLoading(true)
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError) throw postError
      setPost(postData)

      await fetchComments()
    } catch (err) {
      console.error('Error fetching post details:', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchComments() {
    try {
      setLoadingComments(true)
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err.message)
    } finally {
      setLoadingComments(false)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      const { error } = await supabase.from('comments').insert([
        {
          post_id: postId,
          user_id: session.user.id,
          content: newComment.trim(),
        },
      ])

      if (error) throw error
      
      setNewComment('')
      await fetchComments()
      if (onCommentAdded) onCommentAdded()
    } catch (err) {
      alert('Error adding comment: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-surface' : 'bg-white'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className={`mt-4 font-medium transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className={`w-full max-w-4xl h-fit min-h-[90vh] md:min-h-0 md:rounded-xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0F172A] text-textPrimary border border-white/5' : 'bg-white text-gray-900 border border-black/5'}`}>
      {/* Top Bar */}
      <div className={`p-3 flex items-center gap-4 sticky top-0 z-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/95 backdrop-blur border-b border-white/5' : 'bg-white/95 backdrop-blur border-b border-black/5'}`}>
        <button 
          onClick={onClose} 
          className={`p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8 transition-colors duration-300 ${theme === 'dark' ? 'hover:bg-white/5 text-textSecondary hover:text-textPrimary' : 'hover:bg-black/5 text-gray-500 hover:text-gray-900'}`}
        >
          ✕
        </button>
        <div className={`h-6 w-px transition-colors duration-300 ${theme === 'dark' ? 'bg-white/10' : 'bg-black/10'}`}></div>
        <span className={`text-sm font-bold truncate flex-1 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>{post.title}</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
        {/* Main Content Area */}
        <div className={`flex-1 p-6 transition-colors duration-300 ${theme === 'dark' ? 'border-r border-white/5' : 'border-r border-black/5'}`}>
          <div className="mb-6">
            <p className={`text-xs mb-2 flex items-center gap-2 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>
              <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-tighter transition-colors duration-300 ${theme === 'dark' ? 'bg-white/5 text-textPrimary border border-white/5' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>Anonymous</span>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </p>
            <h2 className={`text-2xl font-black leading-tight mb-4 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>{post.title}</h2>
            <div className={`whitespace-pre-wrap leading-relaxed text-lg transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-800'}`}>
              {post.content}
            </div>
          </div>

          {/* Interaction Bar */}
          <div className={`flex items-center gap-6 py-4 border-y font-bold text-sm transition-colors duration-300 ${theme === 'dark' ? 'border-white/5 text-textSecondary' : 'border-black/5 text-gray-500'}`}>
            <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} orientation="horizontal" />
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>{comments.length} Comments</span>
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <p className={`text-sm font-bold mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-700'}`}>Comment as Anonymous</p>
            <div className={`rounded-2xl overflow-hidden focus-within:ring-2 transition-all shadow-sm border transition-colors duration-300 ${theme === 'dark' ? 'bg-surface border-white/10 focus-within:border-nova/50 focus-within:ring-nova/20' : 'bg-white border-gray-200 focus-within:border-blue-500 focus-within:ring-blue-500/20'}`}>
              <textarea
                placeholder="What are your thoughts?"
                className={`w-full p-4 border-none focus:ring-0 min-h-[120px] outline-none resize-none bg-transparent transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary placeholder:text-textSecondary/50' : 'text-gray-800 placeholder:text-gray-400'}`}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <div className={`p-3 flex justify-end border-t transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/50 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-secondary text-white px-6 py-2 rounded-full text-sm font-black hover:brightness-110 disabled:opacity-50 transition-all shadow-md disabled:shadow-none"
                >
                  {isSubmitting ? 'Commenting...' : 'Comment'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Comments Feed */}
          <div className="mt-10 space-y-8">
            <h3 className={`text-lg font-black pb-2 border-b-2 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary border-white/5' : 'text-gray-900 border-gray-100'}`}>All Comments</h3>
            {loadingComments && comments.length === 0 ? (
              <div className={`py-10 text-center transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center">
                <p className={`italic text-lg transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>No comments yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment, i) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-nova flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                      A
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className={`text-sm font-black transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Anonymous</span>
                        <span className={`text-xs transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>{new Date(comment.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className={`rounded-2xl p-4 text-base leading-relaxed border group-hover:border-opacity-100 transition-all transition-colors duration-300 ${theme === 'dark'
                        ? 'bg-surface text-textPrimary border-white/5 group-hover:border-white/15'
                        : 'bg-gray-50 text-gray-800 border-transparent group-hover:border-gray-200'
                      }`}>
                        {comment.content}
                      </div>
                      <div className={`flex items-center gap-4 mt-2 px-1 text-xs font-black transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>
                        <button className="hover:text-secondary transition-colors uppercase tracking-widest">Upvote</button>
                        <button className="hover:text-secondary transition-colors uppercase tracking-widest">Reply</button>
                        <button className="hover:text-secondary transition-colors uppercase tracking-widest">Share</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Desktop) */}
        <div className={`hidden md:block w-80 p-6 h-full border-l transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/30 border-white/5' : 'bg-gray-50 border-black/5'}`}>
          <div className="sticky top-6">
            <div className={`rounded-2xl p-5 border shadow-sm overflow-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-surface border-white/5' : 'bg-white border-black/5'}`}>
              <div className={`h-10 -mx-5 -mt-5 mb-6 flex items-center px-4 ${theme === 'dark' ? 'bg-gradient-to-r from-secondary to-nova' : 'bg-secondary'} rounded-t-2xl`}>
                <span className="text-white font-black text-sm tracking-widest uppercase">Community Guide</span>
              </div>
              <h4 className={`font-black text-lg mb-3 transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Keep it safe.</h4>
              <p className={`text-sm leading-relaxed mb-6 transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>
                This is a judgment-free zone. Please be empathetic, supportive, and kind. We're all fighting the same battles.
              </p>
              <div className={`space-y-4 border-t pt-6 transition-colors duration-300 ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>Shared Insights</span>
                  <span className="font-black text-secondary">8.4k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-500'}`}>Active Now</span>
                  <span className="flex items-center gap-2 font-black text-primary">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    256
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
