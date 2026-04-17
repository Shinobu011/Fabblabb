'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  CheckCircle,
  Send,
  History,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from 'lucide-react'
import { addDays, addWeeks, format, getDay, startOfWeek } from 'date-fns'

const BookingSection = () => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [bookingHistory, setBookingHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE

  // Generate available time slots based on selected date and guidelines
  // Also support selecting next specific weekdays rather than arbitrary date
  const getNextDateForWeekday = (weekday: number) => {
    const today = new Date()
    const todayDay = getDay(today)
    
    // If it's Thursday after 3PM, consider next week
    const isThursdayAfter3PM = todayDay === 4 && today.getHours() >= 15
    
    if (isThursdayAfter3PM) {
      // After Thursday 3PM, show next week's days
      const startOfNextWeek = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1)
      return addDays(startOfNextWeek, weekday)
    } else {
      // Show this week's remaining days first
      const daysUntilTarget = weekday - todayDay
      
      if (daysUntilTarget <= 0) {
        // If weekday has passed this week, show next week
        const startOfNextWeek = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1)
        return addDays(startOfNextWeek, weekday)
      } else {
        // Show this week's remaining day
        return addDays(today, daysUntilTarget)
      }
    }
  }

  const formatISODate = (d: Date) => format(d, 'yyyy-MM-dd')

  // Only show remaining days of current week, or next week if Thursday/Friday/Saturday
  const getAvailableDays = () => {
    const today = new Date()
    const todayDay = getDay(today)
    const currentHour = today.getHours()
    
    // If it's Thursday (any time), Friday, or Saturday, show next week's days
    const isThursday = todayDay === 4
    const isFridayOrSaturday = todayDay === 5 || todayDay === 6
    
    if (isThursday || isFridayOrSaturday) {
      // Thursday, Friday, or Saturday - show next week's days
      return [
        { label: 'Next Sunday', date: formatISODate(getNextDateForWeekday(0)) },
        { label: 'Next Monday', date: formatISODate(getNextDateForWeekday(1)) },
        { label: 'Next Tuesday', date: formatISODate(getNextDateForWeekday(2)) },
        { label: 'Next Wednesday', date: formatISODate(getNextDateForWeekday(3)) },
        { label: 'Next Thursday', date: formatISODate(getNextDateForWeekday(4)) },
      ]
    } else {
      // Sunday to Wednesday - show remaining days of current week (not including today)
      const options = []
      for (let day = 0; day <= 4; day++) { // Sun=0 to Thu=4
        const delta = day - todayDay
        if (delta > 0) { // Only future days (not today)
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
          options.push({
            label: `This ${dayNames[day]}`,
            date: formatISODate(getNextDateForWeekday(day))
          })
        }
      }
      return options
    }
  }

  const nextOptions = getAvailableDays()

  const formatTime = (hour24: number) => {
    const period = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    const padded = hour12 < 10 ? `0${hour12}` : `${hour12}`
    return `${padded}:00 ${period}`
  }

  const getAllowedTimeSlots = (dateStr: string) => {
    if (!dateStr) return [] as string[]
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDay() // 0=Sun ... 6=Sat
    if (day >= 5) {
      // Friday (5) and Saturday (6) closed
      return []
    }
    // Sunday (0) to Wednesday (3): 8:00 - 15:00 closing, last slot 13:00 (1PM)
    // Thursday (4): 8:00 - 12:00 closing, last slot 11:00
    const lastHour = day === 4 ? 11 : 13
    const slots: string[] = []
    for (let h = 8; h <= lastHour; h++) {
      slots.push(formatTime(h))
    }
    return slots
  }

  const availableTimeSlots = getAllowedTimeSlots(formData.date)
  const [fullSlots, setFullSlots] = useState<string[]>([])

  // Fetch availability when date changes
  useEffect(() => {
    let cancelled = false
    async function fetchAvailability() {
      setFullSlots([])
      if (!formData.date) return
      try {
        const res = await fetch(`${apiBase}/bookings/availability?date=${encodeURIComponent(formData.date)}`)
        const data = await res.json().catch(() => ({}))
        if (!cancelled && data?.full) {
          setFullSlots(data.full)
        }
      } catch {}
    }
    fetchAvailability()
    return () => { cancelled = true }
  }, [formData.date])

  // Clear time if it becomes invalid for the chosen date
  useEffect(() => {
    if (formData.time && !availableTimeSlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }))
    }
  }, [formData.date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the data to your backend
    setSubmitError(null)
    ;(async () => {
      try {
        // Check authentication status
        const authRes = await fetch(`${apiBase}/auth/status`, { credentials: 'include' })
        const authData = await authRes.json().catch(() => ({}))
        if (!authData?.authenticated) {
          // Save draft and redirect to login
          try { sessionStorage.setItem('bookingDraft', JSON.stringify(formData)) } catch {}
          const redirect = encodeURIComponent('/#booking')
          window.location.href = `/login?redirect=${redirect}&draft=1`
          return
        }

        const res = await fetch(`${apiBase}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            date: formData.date,
            time: formData.time,
            message: formData.message
          })
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.error) {
          setSubmitError(data?.error || 'Failed to submit booking')
          return
        }
        setIsSubmitted(true)
        setTimeout(() => {
          setIsSubmitted(false)
        }, 3000)
        setFormData({ date: '', time: '', message: '' })
        // Refresh booking history
        fetchBookingHistory()
      } catch (err) {
        setSubmitError('Network error, please try again')
      }
    })()
  }

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${apiBase}/auth/status`, { credentials: 'include' })
      const data = await res.json()
      setIsAuthenticated(data?.authenticated || false)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  // Fetch booking history
  const fetchBookingHistory = async () => {
    try {
      const res = await fetch(`${apiBase}/bookings/history`, { 
        credentials: 'include' 
      })
      const data = await res.json()
      if (res.ok && data?.bookings) {
        setBookingHistory(data.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch booking history:', error)
    }
  }

  // Restore saved draft after returning from login/signup
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('bookingDraft')
      if (raw) {
        const draft = JSON.parse(raw)
        setFormData({
          date: draft?.date || '',
          time: draft?.time || '',
          message: draft?.message || ''
        })
        sessionStorage.removeItem('bookingDraft')
      }
    } catch {}
  }, [])

  // Check auth status and fetch booking history on component mount
  useEffect(() => {
    checkAuthStatus()
    if (isAuthenticated) {
      fetchBookingHistory()
    }
  }, [])

  // Fetch booking history when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookingHistory()
    }
  }, [isAuthenticated])

  return (
    <section id="booking" className="py-20 bg-gradient-to-b from-fablab-light to-white dark:from-gray-900 dark:to-gray-800">
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
            Book Your <span className="bg-gradient-to-r from-fablab-primary to-fablab-accent bg-clip-text text-transparent">Session</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Reserve your time with our machines and bring your creative ideas to life
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Form and Previous Bookings */}
          <div className="space-y-8">
            {/* Booking Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-xl border border-fablab-primary/10 dark:border-gray-700"
            >
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-fablab-primary to-fablab-accent rounded-xl flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-fablab-dark dark:text-white">Book a Session</h3>
            </div>

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-fablab-green mx-auto mb-4" />
                <h4 className="text-2xl font-bold text-fablab-dark mb-2">Booking Request Sent!</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Your booking request has been submitted and is pending admin approval. You will receive an email notification once it's processed.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-fablab-dark dark:text-white mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Preferred Day
                    </label>
                    <select
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fablab-primary focus:border-transparent transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    >
                      <option value="">Select upcoming day</option>
                      {nextOptions.map(opt => (
                        <option key={opt.date} value={opt.date}>{opt.label} ({opt.date})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-fablab-dark dark:text-white mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Preferred Time
                    </label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      required
                    disabled={availableTimeSlots.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fablab-primary focus:border-transparent transition-all duration-300 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    >
                    <option value="">{availableTimeSlots.length ? 'Select time slot' : 'No time slots available'}</option>
                    {availableTimeSlots.map((time) => {
                      const isFull = fullSlots.includes(time)
                      return (
                        <option key={time} value={isFull ? '' : time} disabled={isFull}>
                          {time}{isFull ? ' (Fully booked)' : ''}
                        </option>
                      )
                    })}
                    </select>
                  </div>
                </div>

              {/* Closed days helper */}
              {formData.date && availableTimeSlots.length === 0 && (
                <p className="text-sm text-red-600">FabLab is closed on Fridays and Saturdays. Please choose another date.</p>
              )}

                <div>
                  <label className="block text-sm font-semibold text-fablab-dark dark:text-white mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Project Description
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fablab-primary focus:border-transparent transition-all duration-300 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    placeholder="Tell us about your project and any specific requirements..."
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-fablab-primary to-fablab-accent text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Booking Request</span>
                </motion.button>
              </form>
            )}
            </motion.div>

            {/* Previous Bookings Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-xl border border-fablab-primary/10 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-fablab-primary to-fablab-accent rounded-xl flex items-center justify-center mr-4">
                    <History className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-fablab-dark dark:text-white">Previous Bookings</h3>
                </div>
                {isAuthenticated ? (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-fablab-primary hover:text-fablab-accent transition-colors duration-300"
                  >
                    {showHistory ? 'Hide' : 'Show'} History
                  </button>
                ) : (
                  <a
                    href="/login"
                    className="bg-gradient-to-r from-fablab-primary to-fablab-accent text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Login to View
                  </a>
                )}
              </div>

              {isAuthenticated ? (
                showHistory && (
                  <div className="w-full max-h-64 overflow-y-auto overflow-x-hidden">
                    {bookingHistory.length > 0 ? (
                      <div className="space-y-4 pr-2 w-full">
                        {bookingHistory.map((booking) => (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-fablab-primary" />
                                  <span className="text-sm sm:text-base font-semibold text-fablab-dark dark:text-white">
                                    {new Date(booking.date).toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-fablab-primary" />
                                  <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{booking.time}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-start sm:justify-end space-x-2">
                                {/* Team booking indicator */}
                                {booking.emails && booking.emails.length > 0 && (
                                  <span className="flex items-center px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Team Booking
                                  </span>
                                )}
                                
                                {booking.status === 'pending' && (
                                  <span className="flex items-center px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-medium">
                                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Pending
                                  </span>
                                )}
                                {booking.status === 'approved' && (
                                  <span className="flex items-center px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Approved
                                  </span>
                                )}
                                {booking.status === 'rejected' && (
                                  <span className="flex items-center px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium">
                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Team Information */}
                            {booking.emails && booking.emails.length > 0 && (
                              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                                      Team Members ({booking.emails.length})
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {booking.emails.map((email: string, index: number) => (
                                        <span
                                          key={index}
                                          className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                                        >
                                          {email}
                                        </span>
                                      ))}
                                    </div>
                                    {booking.groupNumber && (
                                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                        Group: {booking.groupNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Requester Information */}
                            {booking.requester && (
                              <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                                      Requested by: {booking.requester.name || booking.requester.email}
                                    </p>
                                    {booking.requester.email && booking.requester.name && (
                                      <p className="text-xs text-green-600 dark:text-green-400">
                                        {booking.requester.email}
                                      </p>
                                    )}
                                    {/* Show if current user is the requester */}
                                    {booking.requester.email && booking.requester.email.toLowerCase() === (typeof window !== 'undefined' ? sessionStorage.getItem('userEmail') : '')?.toLowerCase() && (
                                      <p className="text-xs text-green-700 dark:text-green-300 font-medium mt-1">
                                        ✓ You made this booking
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {booking.message && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  <strong>Project Description:</strong> {booking.message}
                                </p>
                              </div>
                            )}
                            
                            {booking.rejectionReason && (
                              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  <strong>Rejection Reason:</strong> {booking.rejectionReason}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
                              <span>Requested: {new Date(booking.createdAt).toLocaleString()}</span>
                              {booking.processedAt && (
                                <span>Processed: {new Date(booking.processedAt).toLocaleString()}</span>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No previous bookings found.</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Please log in to view your booking history.
                  </p>
                  <a
                    href="/login"
                    className="inline-flex items-center bg-gradient-to-r from-fablab-primary to-fablab-accent text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Login Now
                  </a>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - Guidelines and Available Hours */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-fablab-primary to-fablab-accent rounded-2xl p-6 lg:p-8 text-white">
              <h3 className="text-xl lg:text-2xl font-bold mb-4">Booking Guidelines</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Maximum 1 hour per day</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Maximum 2 teams per hour</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Maximum 3 memebers per team</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span>Bring your own materials</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-fablab-primary/10 dark:border-gray-700">
              <h3 className="text-xl lg:text-2xl font-bold text-fablab-dark dark:text-white mb-4">Available Hours</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sunday - Wednesday</span>
                  <span className="font-semibold text-fablab-dark dark:text-white">8:00 AM - 3:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Thursday</span>
                  <span className="font-semibold text-fablab-dark dark:text-white">8:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Friday - Saturday</span>
                  <span className="font-semibold text-fablab-dark dark:text-white">Closed</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 shadow-lg border border-fablab-primary/10 dark:border-gray-700">
              <h3 className="text-xl lg:text-2xl font-bold text-fablab-dark dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-fablab-primary mr-3" />
                  <span>fablabqena@gmail.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-fablab-primary mr-3" />
                  <span>+20 100 100 1891</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-fablab-primary mr-3" />
                  <span>New Qena City, Qena, Egypt</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default BookingSection
