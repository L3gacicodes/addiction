import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth, useTheme } from '../App'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import CreatePost from '../components/CreatePost'
import PostDetail from '../components/PostDetail'
import UpvoteButton from '../components/UpvoteButton'

export default function CommunityPage() {
  const { session } = useAuth()
  const { theme } = useTheme()
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
      if (!supabase) throw new Error('Supabase not initialized')
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
    <div className={`min-h-screen pb-12 transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep' : 'bg-[#F5F5F7]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/80 border-white/5' : 'bg-white/80 border-black/5'}`}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className={`p-2 rounded-full transition-colors transition-colors duration-300 ${theme === 'dark' ? 'hover:bg-white/5 text-textSecondary hover:text-textPrimary' : 'hover:bg-black/5 text-gray-400 hover:text-gray-900'}`}>
              ←
            </Link>
            <div>
              <h1 className={`text-xl font-black tracking-tight transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>Community</h1>
              <p className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>Shared Recovery Journey</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-community text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg shadow-community/10 hover:brightness-110 transition-all"
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
              className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto" 
            />
            <p className={`mt-4 font-bold uppercase text-[10px] tracking-widest transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>Loading Feed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className={`rounded-3xl p-16 text-center border shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-surface border-white/5' : 'bg-white border-black/5'}`}>
                <span className="text-4xl block mb-4">🌱</span>
                <p className={`text-lg font-medium italic transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>No stories shared yet. Be the first!</p>
              </div>
            ) : (
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`rounded-3xl border cursor-pointer transition-all overflow-hidden flex group transition-colors duration-300 ${theme === 'dark'
                      ? 'bg-surface border-white/5 hover:border-community/30 hover:shadow-[0_0_40px_rgba(20,184,166,0.1)]'
                      : 'bg-white border-black/5 hover:border-community/20 shadow-sm hover:shadow-md hover:shadow-community/5'
                    }`}
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    {/* Upvote section */}
                    <div className={`w-16 flex flex-col items-center py-6 group-hover:bg-community/5 transition-colors border-r transition-colors duration-300 ${theme === 'dark' ? 'bg-backgroundDeep/30 border-white/5' : 'bg-black/[0.02] border-black/5'}`}>
                      <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} />
                    </div>

                    {/* Content section */}
                    <div className="p-6 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black uppercase transition-colors duration-300 ${theme === 'dark' ? 'bg-white/5 text-textSecondary' : 'bg-gray-100 text-gray-500'}`}>A</div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-400'}`}>
                          Anonymous • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <h2 className={`text-xl font-black mb-2 leading-tight group-hover:text-community transition-colors duration-300 ${theme === 'dark' ? 'text-textPrimary' : 'text-gray-900'}`}>
                        {post.title}
                      </h2>
                      <p className={`line-clamp-2 mb-6 leading-relaxed font-medium text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-textSecondary' : 'text-gray-600'}`}>
                        {post.content}
                      </p>
                      
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-community/10 group-hover:text-community transition-colors duration-300 ${theme === 'dark' ? 'bg-white/5 text-textSecondary' : 'bg-black/5 text-gray-500'}`}>
                          <span>💬</span>
                          <span>{post.comments?.[0]?.count || 0} Comments</span>
                        </div>
                        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black/10 transition-colors duration-300 ${theme === 'dark' ? 'bg-white/5 text-textSecondary hover:bg-white/10' : 'bg-black/5 text-gray-500'}`}>
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
