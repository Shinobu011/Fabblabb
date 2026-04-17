'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, ArrowLeft, Lock, Users, Calendar, Award } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  username: string
  grade: string
  [key: string]: any
}

interface Video {
  id: string
  title: string
  description: string
  thumb: string
  videoUrl: string
  duration: string
  difficulty: string
  category: string
  [key: string]: any
}

const VideosPage = () => {
  const [user, setUser] = useState<User | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const router = useRouter()

  // Check authentication and fetch videos
  useEffect(() => {
    const checkAuthAndFetchVideos = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE
        
        // Check authentication
        const authResponse = await fetch(`${apiBase}/auth/status`, {
          credentials: 'include'
        })
        const authData = await authResponse.json()
        
        if (authData.authenticated) {
          setUser(authData.user)
          
          // Fetch videos
          const videosResponse = await fetch(`${apiBase}/api/videos`, {
            credentials: 'include'
          })
          const videosData = await videosResponse.json()
          
          if (videosData.videos) {
            setVideos(videosData.videos)
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth or videos fetch failed:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkAuthAndFetchVideos()
  }, [router])


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            Videos related to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {user?.grade} Capstone
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Exclusive capstone videos tailored for your grade level. Master advanced techniques and build impressive projects.
          </p>
        </motion.div>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/60 dark:border-gray-700/60"
            >
              <div className="relative">
                <img 
                  src={video.thumb} 
                  alt={video.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => setSelectedVideo(video)}
                    className="bg-white/90 hover:bg-white text-gray-800 px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span className="font-semibold">Watch Now</span>
                  </button>
                </div>
                <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                  {video.duration}
                </div>
                <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {video.difficulty}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{video.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{video.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{user?.grade}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No Videos Available</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Videos for Grade {user?.grade} are being prepared. Check back soon!
              </p>
            </div>
          </motion.div>
        )}

        {/* Video Modal */}
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="aspect-video">
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{selectedVideo.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{selectedVideo.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedVideo.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>{selectedVideo.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{selectedVideo.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

export default VideosPage
