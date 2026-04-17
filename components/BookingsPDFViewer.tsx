'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Clock, RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react'

interface BookingsPDFViewerProps {
  className?: string
  refreshKey?: number | string
}

const BookingsPDFViewer: React.FC<BookingsPDFViewerProps> = ({ className = '', refreshKey }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [cacheBuster, setCacheBuster] = useState(Date.now())

  // This is the URL to your real-time updated schedule
  const scheduleUrl = '/api/bookings-schedule'

  // Refresh PDF when refreshKey changes (e.g., after booking approval/rejection)
  useEffect(() => {
    if (refreshKey !== undefined && iframeRef.current) {
      setIsLoading(true)
      const newCacheBuster = Date.now()
      setCacheBuster(newCacheBuster)
      const refreshUrl = `${scheduleUrl}?t=${newCacheBuster}`
      iframeRef.current.src = refreshUrl
    }
  }, [refreshKey])

  const handleDownload = () => {
    // Print the schedule (user can save as PDF)
    window.print()
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Force refresh the schedule by adding a timestamp parameter
    const newCacheBuster = Date.now()
    setCacheBuster(newCacheBuster)
    const refreshUrl = `${scheduleUrl}?t=${newCacheBuster}`
    if (iframeRef.current) {
      iframeRef.current.src = refreshUrl
    } else {
      // Fallback if ref is not available
      const iframe = document.querySelector('iframe') as HTMLIFrameElement
      if (iframe) {
        iframe.src = refreshUrl
      }
    }
    // Loading state will be cleared by onLoad handler
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Daily Bookings Schedule
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Updates in real-time with each booking (Click Print to save as PDF)</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh PDF"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
            title="Print/Save as PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Print/PDF</span>
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'p-6'}`}>
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              title="Close Fullscreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className={`${isFullscreen ? 'h-full' : 'h-96 sm:h-[500px] lg:h-[600px]'} rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}>
          <iframe
            ref={iframeRef}
            src={`${scheduleUrl}?t=${cacheBuster}`}
            className="w-full h-full"
            title="Daily Bookings Schedule"
            onLoad={() => setIsLoading(false)}
          />
        </div>
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Schedule Update Information</p>
            <p>
              This schedule is automatically updated in real-time whenever a booking is approved or rejected. 
              Click "Print/PDF" to save as a PDF file or print the schedule. Use Refresh to manually reload the latest version.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingsPDFViewer
