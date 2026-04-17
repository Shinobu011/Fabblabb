'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, AlertCircle, PlusCircle, Clock, XCircle, User, Eye, RefreshCw } from 'lucide-react'
import BookingsPDFViewer from '@/components/BookingsPDFViewer'

export default function TeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [grade, setGrade] = useState('G10')
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      const res = await fetch(`${apiBase}/admin/team/requests`, { credentials: 'include' })
      const data = await res.json()
      if (data.requests) {
        setRequests(data.requests)
      } else {
        setRequests([])
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
      setError('Failed to load your requests. Please try again.')
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    const checkTeamMember = async () => {
      try {
        const res = await fetch(`${apiBase}/admin/team/status`, { credentials: 'include' })
        const data = await res.json()
        if (!data?.isTeamMember) {
          // Check if user is admin and redirect to admin dashboard
          const adminRes = await fetch(`${apiBase}/admin/status`, { credentials: 'include' })
          const adminData = await adminRes.json()
          if (adminData?.isAdmin) {
            router.replace('/admin')
            return
          }
          router.replace('/')
          return
        }
        setIsTeamMember(true)
        await fetchRequests()
      } catch (err) {
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }
    checkTeamMember()
  }, [apiBase, router])

  const handleRequestVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!url || !reason) {
      setError('Please enter a YouTube URL and reason')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/team/request-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grade, url, reason })
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to submit video request')
        return
      }
      setSuccess('Video request submitted successfully! Waiting for admin approval.')
      setUrl('')
      setReason('')
      await fetchRequests()
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isTeamMember) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <div className="text-sm text-gray-600 dark:text-gray-400">Team Member Dashboard</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6">Request Videos</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Submit video requests for admin approval. Your requests will be reviewed before being added to the platform.</p>

          {/* Request Form */}
          <form onSubmit={handleRequestVideo} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 space-y-5 shadow mb-12">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition border-gray-300 dark:border-gray-600 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="G10">G10</option>
                  <option value="G11">G11</option>
                  <option value="G12">G12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or /shorts/..."
                  className="w-full py-2.5 px-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition border-gray-300 dark:border-gray-600 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Why should this video be added?"
                  className="w-full py-2.5 px-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition border-gray-300 dark:border-gray-600 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-xl shadow hover:shadow-lg transition disabled:opacity-60"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Submit Request</span>
            </button>
          </form>

          {/* My Requests */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">My Requests</h2>
                {!loadingRequests && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {requests.length} request{requests.length !== 1 ? 's' : ''} submitted
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  fetchRequests()
                  // Also refresh PDF when refresh button is clicked
                  setPdfRefreshKey(prev => prev + 1)
                }}
                disabled={loadingRequests}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRequests ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {loadingRequests ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading your requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <User className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No requests yet</h3>
                <p className="text-gray-500 dark:text-gray-500">Submit your first video request above</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {requests.map((request: any) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all flex flex-col h-full"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={request.thumbnail}
                        alt={request.title}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        {request.duration}
                      </div>
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">{request.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{request.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {request.grade}
                            </span>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              <span className="text-xs text-gray-600 dark:text-gray-400">{request.status}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            <strong>Reason:</strong> {request.reason}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <strong>Requested:</strong> {new Date(request.requestedAt).toLocaleDateString()}
                          </p>
                          {request.processedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <strong>Processed:</strong> {new Date(request.processedAt).toLocaleDateString()}
                              {request.processedByName && (
                                <span> by {request.processedByName}</span>
                              )}
                            </p>
                          )}
                          {request.rejectionReason && (
                            <p className="text-xs text-red-600 line-clamp-2">
                              <strong>Rejection Reason:</strong> {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <a
                        href={request.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm transition-colors mt-auto"
                      >
                        <Eye className="w-4 h-4" />
                        Watch Video
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Bookings Schedule PDF */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Daily Bookings Schedule</h2>
            <BookingsPDFViewer refreshKey={pdfRefreshKey} />
          </div>
        </motion.div>
      </div>

      {/* Creator Credit - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-30">
        <motion.a
          href="tel:+201153106449"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300"
          title="Contact Yousef Gaber - Website Creator"
        >
          <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            Made by
          </span>
          <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Yousef Gaber
          </span>
        </motion.a>
      </div>
    </main>
  )
}
