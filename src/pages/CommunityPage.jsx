import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../App'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CreatePost from '../components/CreatePost'
import PostDetail from '../components/PostDetail'
import UpvoteButton from '../components/UpvoteButton'

export default function CommunityPage() {
  const { session } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          comments(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Error fetching posts:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePostCreated = () => {
    setShowCreateModal(false)
    fetchPosts()
  }

  const handleCommentAdded = () => {
    fetchPosts()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              ←
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Community</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shared Recovery Journey</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Create Post
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        {loading ? (
          <div className="text-center py-20">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" 
            />
            <p className="mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading Feed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <span className="text-4xl block mb-4">🌱</span>
                <p className="text-slate-400 text-lg font-medium italic">No stories shared yet. Be the first!</p>
              </div>
            ) : (
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-all overflow-hidden flex shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 group"
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    {/* Upvote section */}
                    <div className="bg-slate-50/50 w-16 flex flex-col items-center py-6 group-hover:bg-indigo-50/30 transition-colors border-r border-slate-50">
                      <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} />
                    </div>

                    {/* Content section */}
                    <div className="p-6 flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">A</div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          Anonymous • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-slate-600 line-clamp-2 mb-6 leading-relaxed font-medium text-sm">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <span>💬</span>
                          <span>{post.comments?.[0]?.count || 0} Comments</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-colors">
                          <span>↗️</span>
                          <span>Share</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl"
            >
              <CreatePost 
                onPostCreated={handlePostCreated} 
                onCancel={() => setShowCreateModal(false)} 
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPostId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex justify-center p-0 md:p-10 z-50 overflow-y-auto"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-5xl"
            >
              <PostDetail 
                postId={selectedPostId} 
                onClose={() => setSelectedPostId(null)} 
                onCommentAdded={handleCommentAdded}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
