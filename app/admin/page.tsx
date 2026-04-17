'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, AlertCircle, PlusCircle, Trash2, Play, Check, X, Eye, Calendar, Clock, User, Mail } from 'lucide-react'
import BookingsPDFViewer from '@/components/BookingsPDFViewer'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [grade, setGrade] = useState('G10')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [videos, setVideos] = useState({ g10: [], g11: [], g12: [] })
  const [selectedGrade, setSelectedGrade] = useState('G10')
  const [requests, setRequests] = useState([])
  const [showRequests, setShowRequests] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedRequestId, setSelectedRequestId] = useState('')
  const [bookings, setBookings] = useState([])
  const [showBookings, setShowBookings] = useState(false)
  const [showBookingRejectModal, setShowBookingRejectModal] = useState(false)
  const [bookingRejectReason, setBookingRejectReason] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/videos`, { credentials: 'include' })
      const data = await res.json()
      if (data.videos) {
        setVideos(data.videos)
      }
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/requests`, { credentials: 'include' })
      const data = await res.json()
      if (data.requests) {
        setRequests(data.requests)
      }
    } catch (err) {
      console.error('Failed to fetch requests:', err)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${apiBase}/admin/bookings`, { credentials: 'include' })
      const data = await res.json()
      if (data.bookings) {
        setBookings(data.bookings)
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err)
    }
  }

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch(`${apiBase}/admin/status`, { credentials: 'include' })
        const data = await res.json()
        if (!data?.isAdmin) {
          // Check if user is team member and redirect to team dashboard
          const teamRes = await fetch(`${apiBase}/admin/team/status`, { credentials: 'include' })
          const teamData = await teamRes.json()
          if (teamData?.isTeamMember) {
            router.replace('/admin/team')
            return
          }
          router.replace('/')
          return
        }
        setIsAdmin(true)
        await fetchVideos()
        await fetchRequests()
        await fetchBookings()
      } catch (err) {
        router.replace('/')
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [apiBase, router])

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!url) {
      setError('Please enter a YouTube URL')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/videos/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grade, url })
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to add video')
        return
      }
      setSuccess('Video added successfully')
      setUrl('')
      await fetchVideos()
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveVideo = async (videoUrl: string, videoGrade: string) => {
    if (!confirm('Are you sure you want to remove this video?')) return
    
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/videos/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grade: videoGrade, url: videoUrl })
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to remove video')
        return
      }
      setSuccess('Video removed successfully')
      await fetchVideos()
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/requests/${requestId}/approve`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to approve request')
        return
      }
      setSuccess('Video request approved and added successfully')
      await fetchVideos()
      await fetchRequests()
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectRequest = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/requests/${selectedRequestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason })
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to reject request')
        return
      }
      setSuccess('Video request rejected')
      setShowRejectModal(false)
      setRejectReason('')
      setSelectedRequestId('')
      await fetchRequests()
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveBooking = async (bookingId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/bookings/${bookingId}/approve`, {
        method: 'POST',
        credentials: 'include'
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to approve booking')
        return
      }
      setSuccess('Booking request approved')
      await fetchBookings()
      // Refresh PDF to show updated schedule
      setPdfRefreshKey(prev => prev + 1)
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setBookingRejectReason('')
    setShowBookingRejectModal(true)
  }

  const handleConfirmBookingReject = async () => {
    if (!bookingRejectReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/admin/bookings/${selectedBookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: bookingRejectReason })
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to reject booking')
        return
      }
      setSuccess('Booking request rejected')
      setShowBookingRejectModal(false)
      setBookingRejectReason('')
      setSelectedBookingId('')
      await fetchBookings()
      // Refresh PDF to show updated schedule
      setPdfRefreshKey(prev => prev + 1)
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900">
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
            <div className="text-sm text-gray-600 dark:text-gray-400">Admin Dashboard</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">Manage videos and approve team requests</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setShowRequests(false); setShowBookings(false); setShowPDFViewer(false); }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  !showRequests && !showBookings && !showPDFViewer
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Manage Videos</span>
                <span className="sm:hidden">Videos</span>
              </button>
              <button
                onClick={() => { setShowRequests(true); setShowBookings(false); setShowPDFViewer(false); }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  showRequests && !showBookings && !showPDFViewer
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Review Requests ({requests.filter((r: any) => r.status === 'pending').length})</span>
                <span className="sm:hidden">Requests ({requests.filter((r: any) => r.status === 'pending').length})</span>
              </button>
              <button
                onClick={() => { setShowRequests(false); setShowBookings(true); setShowPDFViewer(false); }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  showBookings && !showRequests && !showPDFViewer
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Manage Bookings ({bookings.filter((b: any) => b.status === 'pending').length})</span>
                <span className="sm:hidden">Bookings ({bookings.filter((b: any) => b.status === 'pending').length})</span>
              </button>
              <button
                onClick={() => { setShowRequests(false); setShowBookings(false); setShowPDFViewer(true); }}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition text-sm sm:text-base whitespace-nowrap ${
                  showPDFViewer && !showRequests && !showBookings
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">Bookings Schedule</span>
                <span className="sm:hidden">Schedule</span>
              </button>
            </div>
          </div>

          {!showRequests && !showBookings && !showPDFViewer ? (
            <>
              <form onSubmit={handleAddVideo} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-6 space-y-5 shadow">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-1">
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">YouTube URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full py-2.5 px-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition border-gray-300 dark:border-gray-600 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-xl shadow hover:shadow-lg transition disabled:opacity-60"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </form>

          {/* Video List */}
          <div className="mt-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Videos</h2>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="G10">Grade 10</option>
                <option value="G11">Grade 11</option>
                <option value="G12">Grade 12</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos[selectedGrade.toLowerCase() as keyof typeof videos]?.map((video: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
                >
                  <div className="relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {video.duration}
                    </div>
                    <button
                      onClick={() => handleRemoveVideo(video.url, selectedGrade)}
                      className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      title="Remove video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {selectedGrade}
                      </span>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Watch
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {videos[selectedGrade.toLowerCase() as keyof typeof videos]?.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Play className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No videos for {selectedGrade}</h3>
                <p className="text-gray-500 dark:text-gray-500">Add videos using the form above</p>
              </div>
            )}
          </div>
            </>
          ) : showRequests ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Video Requests</h2>
              
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <CheckCircle2 className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No requests</h3>
                  <p className="text-gray-500 dark:text-gray-500">No video requests to review</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {requests.map((request: any) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col h-full"
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
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              by {request.requestedByName}
                            </span>
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
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <a
                            href={request.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm transition-colors mb-2"
                          >
                            <Eye className="w-4 h-4" />
                            Watch Video
                          </a>
                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded-lg text-xs transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded-lg text-xs transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : showBookings ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Booking Requests</h2>
              
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No bookings</h3>
                  <p className="text-gray-500 dark:text-gray-500">No booking requests to review</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bookings.map((booking: any) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl overflow-hidden shadow-lg flex flex-col h-full"
                    >
                      <div className="p-4 flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold text-gray-800 dark:text-white">
                                {new Date(booking.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.status.toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{booking.time}</span>
                            </div>
                            
                            {booking.isStemQena && booking.groupNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                  Group {booking.groupNumber}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                <strong>Requested by:</strong> {booking.requester?.name || booking.username}
                              </span>
                            </div>
                            
                            {booking.isStemQena && booking.teamMembers && booking.teamMembers.length > 0 && (
                              <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1">
                                  Team Members:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {booking.teamMembers.map((member: any, idx: number) => (
                                    <li key={idx} className="text-xs text-purple-600 dark:text-purple-400">
                                      {member.username} {(member.email === (booking.requester?.email || booking.userEmail)) && <span className="font-semibold">(Requester)</span>}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{booking.requester?.email || booking.userEmail}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {booking.grade}
                              </span>
                            </div>
                            
                            {booking.message && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                                  <strong>Project Description:</strong> {booking.message}
                                </p>
                              </div>
                            )}
                            
                            {booking.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  <strong>Rejection Reason:</strong> {booking.rejectionReason}
                                </p>
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                              <p><strong>Requested:</strong> {new Date(booking.createdAt).toLocaleString()}</p>
                              {booking.processedAt && (
                                <p><strong>Processed:</strong> {new Date(booking.processedAt).toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          {booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveBooking(booking.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded-lg text-xs transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking.id)}
                                className="flex-1 flex items-center justify-center gap-1 bg-red-600 hover:bg-red-700 text-white py-2 px-2 rounded-lg text-xs transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : showPDFViewer ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Daily Bookings Schedule</h2>
              <BookingsPDFViewer refreshKey={pdfRefreshKey} />
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reject Video Request</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please provide a reason for rejecting this video request:</p>
            
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-500 outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason('')
                  setSelectedRequestId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Rejection Reason Modal */}
      {showBookingRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Reject Booking Request</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Please provide a reason for rejecting this booking request:</p>
            
            <textarea
              value={bookingRejectReason}
              onChange={e => setBookingRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 focus:border-red-500 outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              rows={4}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowBookingRejectModal(false)
                  setBookingRejectReason('')
                  setSelectedBookingId('')
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBookingReject}
                disabled={loading || !bookingRejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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


