import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App'
import UpvoteButton from './UpvoteButton'

export default function PostDetail({ postId, onClose, onCommentAdded }) {
  const { session } = useAuth()
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
      // Fetch the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (postError) throw postError
      setPost(postData)

      // Fetch comments
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
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) return null

  return (
    <div className="bg-white w-full max-w-4xl h-fit min-h-[90vh] md:min-h-0 md:rounded-xl shadow-2xl flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="bg-black text-white p-3 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={onClose} 
          className="hover:bg-gray-800 p-2 rounded-full transition-colors flex items-center justify-center w-8 h-8"
        >
          ✕
        </button>
        <div className="h-6 w-px bg-gray-700"></div>
        <span className="text-sm font-bold truncate flex-1">{post.title}</span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto">
        {/* Main Content Area */}
        <div className="flex-1 p-6 border-r border-gray-100">
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-bold uppercase tracking-tighter">Anonymous</span>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleString()}</span>
            </p>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-4">{post.title}</h2>
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
              {post.content}
            </div>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center gap-6 py-4 border-y border-gray-50 text-gray-500 font-bold text-sm">
            <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} orientation="horizontal" />
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>{comments.length} Comments</span>
            </div>
          </div>

          {/* Comment Section */}
          <div className="mt-8">
            <p className="text-sm font-bold mb-3 text-gray-700">Comment as Anonymous</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:border-blue-500 transition-all shadow-sm">
              <textarea
                placeholder="What are your thoughts?"
                className="w-full p-4 border-none focus:ring-0 min-h-[120px] outline-none text-gray-800"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <div className="bg-gray-50 p-2 flex justify-end border-t border-gray-100">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-600 text-white px-6 py-1.5 rounded-full text-sm font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                >
                  {isSubmitting ? 'Commenting...' : 'Comment'}
                </button>
              </div>
            </div>
          </div>

          {/* Comments Feed */}
          <div className="mt-10 space-y-8">
            <h3 className="text-lg font-black text-gray-900 border-b-2 border-gray-100 pb-2">All Comments</h3>
            {loadingComments && comments.length === 0 ? (
              <div className="py-10 text-center text-gray-400">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-400 italic text-lg">No comments yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-sm font-black text-gray-900">Anonymous</span>
                        <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 text-gray-800 text-base leading-relaxed border border-transparent group-hover:border-gray-200 transition-all">
                        {comment.content}
                      </div>
                      <div className="flex items-center gap-4 mt-2 px-1 text-xs text-gray-500 font-black">
                        <button className="hover:text-blue-600 transition-colors uppercase tracking-widest">Upvote</button>
                        <button className="hover:text-blue-600 transition-colors uppercase tracking-widest">Reply</button>
                        <button className="hover:text-blue-600 transition-colors uppercase tracking-widest">Share</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Desktop) */}
        <div className="hidden md:block w-80 p-6 bg-gray-50 h-full border-l border-gray-100">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
              <div className="bg-blue-600 h-10 -mx-5 -mt-5 rounded-t-2xl mb-6 flex items-center px-4">
                <span className="text-white font-black text-sm tracking-widest uppercase">Community Guide</span>
              </div>
              <h4 className="font-black text-gray-900 text-lg mb-3">Keep it safe.</h4>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                This is a judgment-free zone. Please be empathetic, supportive, and kind. We're all fighting the same battles.
              </p>
              <div className="space-y-4 border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Shared Insights</span>
                  <span className="font-black text-blue-600">8.4k</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Now</span>
                  <span className="flex items-center gap-2 font-black text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
