'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Lock } from 'lucide-react'


const VideosSection = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE
        const response = await fetch(`${apiBase}/auth/status`, {
          credentials: 'include'
        })
        const data = await response.json()
        if (data.authenticated) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Replace with your capstone/browsing videos thumbnails and URLs
  const videos = [
    {
      id: 1,
      title: 'مشروع : إصنع آلة التلحيم النقطي وإِبْدأْ مشروعك spot welding machine',
      thumb: 'https://i.ytimg.com/vi/rMw8OkUW4R4/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBkfqc5xpMxoDG4-JvjMImfvJxzFA'
    },
    {
      id: 2,
      title: 'من الخردة ، صنعت فرن لتشكيل الأكريليك ، البلاستيك ،Pvc ...',
      thumb: 'https://i.ytimg.com/vi/5ZQSxunU_uY/hq720.jpg?sqp=-oaymwEnCNAFEJQDSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBvxaut59wNZXl_Lsgpe9vxbTw39Q'
    },
    {
      id: 3,
      title: 'Traffic Light Using Arduino #arduino #arduinoproject #diy',
      thumb: 'https://i.ytimg.com/vi/9Pszkxcu6lw/oar2.jpg?sqp=-oaymwEoCJUDENAFSFqQAgHyq4qpAxcIARUAAIhC2AEB4gEKCBgQAhgGOAFAAQ==&rs=AOn4CLBmLsFQ6CQSd1TboY9rT2MqWNt64Q'
    }
  ]

  return (
    <section id="videos" className="py-20 bg-gradient-to-b from-white to-fablab-light dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-fablab-dark dark:text-white mb-4">
            Browsing <span className="bg-gradient-to-r from-fablab-primary to-fablab-accent bg-clip-text text-transparent">Videos</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            {user ? `Welcome back, ${user.username}! Access your grade ${user.grade} capstone videos.` : 'Preview our capstone videos. Sign in to watch in full.'}
          </p>
        </motion.div>

        {/* Blurred Video Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60"
            >
              <Link href={user ? "/videos" : "/login"} className="block">
                <div className="relative h-56">
                  <img 
                    src={video.thumb} 
                    alt={video.title} 
                    className="w-full h-full object-cover filter blur-sm scale-105 group-hover:blur-[1px] transition-all duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-center gap-3 bg-white/90 px-4 py-2 rounded-full shadow-2xl group-hover:scale-105 transition-transform">
                      <Play className="w-5 h-5 text-fablab-primary" />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-800">{user ? 'Access Videos' : 'Watch'}</span>
                      {!user && <Lock className="w-4 h-4 text-gray-600" />}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{video.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user ? `Grade ${user.grade} capstone content` : 'Restricted preview • Members only'}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default VideosSection


