'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Plus, Trash2, AlertCircle, CheckCircle, LogIn } from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  mode?: 'normal' | 'slightly_annoyed' | 'searching' | 'thinking' | 'crying' | 'sad' | 'confused' | 'heart_giving'
}

interface ChatInstance {
  id: string
  name: string
  messages: ChatMessage[]
  startTime: number
  lastActivity: number
  createdAt: number
}

interface Toast {
  id: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
}

const MAX_CHATS = 3
// Get inactivity timeout from env (in minutes), default to 2 minutes
const getInactivityTimeout = () => {
  if (typeof window !== 'undefined') {
    return parseInt(process.env.NEXT_PUBLIC_CHAT_INACTIVITY_TIMEOUT_MINUTES || '2', 10) * 60 * 1000
  }
  return 2 * 60 * 1000 // Default 2 minutes
}
const INACTIVITY_TIMEOUT = getInactivityTimeout()
const CHAT_CREATION_COOLDOWN = 30 * 1000 // 30 seconds

// Log timeout on module load
if (typeof window !== 'undefined') {
  console.log('Chat inactivity timeout:', INACTIVITY_TIMEOUT / 1000, 'seconds', `(${INACTIVITY_TIMEOUT / 60000} minutes)`)
}

// Chat List Item Component with auto-delete functionality
const ChatListItem = ({
  chat,
  isActive,
  onSwitch,
  onDelete,
  countdownUpdate,
  inactivityTimeout,
  deleteChat
}: {
  chat: ChatInstance
  isActive: boolean
  onSwitch: () => void
  onDelete: () => void
  countdownUpdate: number
  inactivityTimeout: number
  deleteChat: (chatId: string, sendToDiscord: boolean, isInactivity: boolean) => Promise<void>
}) => {
  const currentTime = Date.now()
  const timeRemaining = Math.max(0, inactivityTimeout - (currentTime - chat.lastActivity))
  const minutesRemaining = Math.floor(timeRemaining / 60000)
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000)
  const timeDisplay = `${minutesRemaining}:${secondsRemaining.toString().padStart(2, '0')}`

  // Auto-delete chat when timer expires
  const hasExpiredRef = useRef(false)
  useEffect(() => {
    // Check if timer has expired (timeRemaining is 0 or negative)
    if (timeRemaining <= 0 && chat.id && !hasExpiredRef.current) {
      hasExpiredRef.current = true
      // Delete chat and send to Discord - ensure it completes before removing from UI
      deleteChat(chat.id, true, true)
        .then(() => {
          console.log('Chat deleted and saved to Discord:', chat.id)
        })
        .catch(error => {
          console.error('Failed to delete chat on timer expiry:', error)
          hasExpiredRef.current = false // Reset on error so it can retry
        })
    } else if (timeRemaining > 0) {
      // Reset the flag if timer is still active (shouldn't happen, but safety check)
      hasExpiredRef.current = false
    }
  }, [timeRemaining, chat.id, deleteChat])

  return (
    <div
      onClick={onSwitch}
      className={`p-2 sm:p-3 cursor-pointer border-r sm:border-r-0 sm:border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors flex-shrink-0 sm:flex-shrink touch-manipulation ${isActive ? 'bg-fablab-primary/10 border-l-4 border-l-fablab-primary' : ''
        }`}
    >
      <div className="flex items-start justify-between min-w-[100px] sm:min-w-0">
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-xs sm:text-sm truncate ${isActive ? 'text-fablab-primary' : 'text-gray-700 dark:text-gray-300'}`}>
            {chat.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
            {chat.messages.length - 1} msgs
          </p>
          {timeRemaining > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 sm:mt-1" data-countdown={countdownUpdate}>
              {timeDisplay}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="ml-2 p-1.5 sm:p-1 hover:bg-red-500/20 active:bg-red-500/30 rounded transition-colors flex-shrink-0 touch-manipulation"
          aria-label="Delete chat"
        >
          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500 hover:text-red-500" />
        </button>
      </div>
    </div>
  )
}

// Chibi Icon Component
const ChibiIcon = ({ mode = 'normal', size = 'w-4 h-4', className = '', messageId }: { mode?: string, size?: string, className?: string, messageId?: string }) => {
  const [imageError, setImageError] = useState(false)

  // Map mode to actual file names (handle case sensitivity)
  const modeToFile: Record<string, string> = {
    'normal': 'normal',
    'slightly_annoyed': 'slightly_annoyed',
    'searching': 'searching',
    'thinking': 'thinking',
    'crying': 'crying',
    'sad': 'sad',
    'confused': 'Confused', // Handle capitalized file name
    'heart_giving': 'heart_giving'
  }

  const normalizedMode = (mode || 'normal').toLowerCase().trim()
  const fileName = modeToFile[normalizedMode] || 'normal'
  const imageSrc = `/images/chibi/${fileName}.jpeg`

  // Debug logging
  useEffect(() => {
    console.log(`[ChibiIcon] Rendering: mode="${mode}", normalized="${normalizedMode}", fileName="${fileName}", src="${imageSrc}"`)
    setImageError(false)
  }, [mode, normalizedMode, fileName, imageSrc])

  if (imageError) {
    console.log(`[ChibiIcon] Image error for mode="${mode}", falling back to Bot icon`)
    return <Bot className={`${size} ${className}`} />
  }

  // Use a unique key that includes both messageId and mode to force remount when mode changes
  const uniqueKey = `chibi-${messageId}-${normalizedMode}-${fileName}`

  return (
    <img
      src={imageSrc}
      alt={normalizedMode}
      className={`${size} object-contain ${className}`}
      key={uniqueKey}
      onError={() => {
        console.error(`[ChibiIcon] Failed to load: ${imageSrc} for mode="${mode}"`)
        setImageError(true)
      }}
      onLoad={() => {
        console.log(`[ChibiIcon] Successfully loaded: ${imageSrc} for mode="${mode}"`)
      }}
    />
  )
}

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [chats, setChats] = useState<ChatInstance[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userInfo, setUserInfo] = useState<{ username: string, email: string, phone: string, grade: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const wasAuthenticatedRef = useRef<boolean>(false)
  const initialAuthCheckRef = useRef<boolean>(true)
  const [lastChatCreation, setLastChatCreation] = useState<number>(0)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [countdownUpdate, setCountdownUpdate] = useState(0) // Force re-render for countdown
  const [isGenerating, setIsGenerating] = useState(false)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE
  const inactivityTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const toastTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Track mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update countdown every second for real-time display
  // This will be updated after checkAndDeleteExpiredChats is defined

  // Toast notification system
  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts(prev => [...prev, { id, message, type }])

    // Auto-remove toast after 4 seconds
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimersRef.current.delete(id)
    }, 4000)

    toastTimersRef.current.set(id, timer)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = toastTimersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      toastTimersRef.current.delete(id)
    }
  }, [])

  // No localStorage - chats are only stored in memory and saved to database when deleted/expired

  // Check authentication and admin/team member status
  const checkAuthStatus = useCallback(async (isInitialCheck: boolean = false) => {
    // Only show loading state on initial check, not on periodic checks
    if (isInitialCheck || initialAuthCheckRef.current) {
      setAuthLoading(true)
      initialAuthCheckRef.current = false
    }
    try {
      if (!apiBase) {
        console.warn('API base not configured')
        setAuthLoading(false)
        return
      }

      const authRes = await fetch(`${apiBase}/auth/status`, {
        credentials: 'include'
      })

      if (!authRes.ok) {
        console.error('Auth status check failed:', authRes.status)
        setIsAuthenticated(false)
        setAuthLoading(false)
        return
      }

      const authData = await authRes.json().catch((err) => {
        console.error('Failed to parse auth response:', err)
        return { authenticated: false }
      })

      console.log('Auth check result:', authData)

      if (authData?.authenticated) {
        setIsAuthenticated(true)
        wasAuthenticatedRef.current = true
        const email = authData.user?.email || ''
        const username = authData.user?.username || ''
        const grade = authData.user?.grade || ''
        const phone = authData.user?.phone || ''

        setUserEmail(email)

        // If phone is not in session, fetch from accounts database
        let userPhone = phone
        if (!userPhone && email) {
          try {
            const accountsRes = await fetch(`/api/user-info?email=${encodeURIComponent(email)}`, {
              credentials: 'include'
            })
            const accountsData = await accountsRes.json().catch(() => ({}))
            if (accountsData?.phone) {
              userPhone = accountsData.phone
            }
          } catch (err) {
            console.error('Failed to fetch user phone:', err)
          }
        }

        setUserInfo({
          username,
          email,
          phone: userPhone,
          grade
        })

        // Load chats from database
        try {
          const chatsRes = await fetch(`/api/ai-chat-load?userEmail=${encodeURIComponent(email)}`, {
            credentials: 'include'
          })
          const chatsData = await chatsRes.json().catch(() => ({ chats: [] }))

          if (chatsData?.chats && Array.isArray(chatsData.chats) && chatsData.chats.length > 0) {
            // Filter out expired chats
            const currentTime = Date.now()
            const activeChats = chatsData.chats.filter((chat: ChatInstance) => {
              const timeRemaining = INACTIVITY_TIMEOUT - (currentTime - (chat.lastActivity || chat.createdAt || 0))
              return timeRemaining > 0
            })

            if (activeChats.length > 0) {
              console.log(`Loaded ${activeChats.length} active chats from database`)
              setChats(activeChats)
              // Set the most recent chat as active
              setActiveChatId(activeChats[0].id)
            } else {
              console.log('No active chats found in database')
            }
          }
        } catch (err) {
          console.error('Failed to load chats from database:', err)
        }

        try {
          const adminRes = await fetch(`${apiBase}/admin/status`, { credentials: 'include' })
          const adminData = await adminRes.json().catch(() => ({ isAdmin: false }))
          setIsAdmin(adminData?.isAdmin || false)
        } catch (err) {
          setIsAdmin(false)
        }

        try {
          const teamRes = await fetch(`${apiBase}/admin/team/status`, { credentials: 'include' })
          const teamData = await teamRes.json().catch(() => ({ isTeamMember: false }))
          setIsTeamMember(teamData?.isTeamMember || false)
        } catch (err) {
          setIsTeamMember(false)
        }
      } else {
        // User logged out - clear all chats and reset state
        const wasAuthenticated = wasAuthenticatedRef.current
        setIsAuthenticated(false)
        wasAuthenticatedRef.current = false
        setUserInfo(null)
        setUserEmail('')
        setIsAdmin(false)
        setIsTeamMember(false)

        // Clear all chats when user logs out (but not on initial load)
        if (wasAuthenticated) {
          console.log('User logged out - clearing all chats')
          setChats([])
          setActiveChatId(null)
          // Clear all timers
          inactivityTimersRef.current.forEach(timer => clearTimeout(timer))
          inactivityTimersRef.current.clear()
          discordSentRef.current.clear()
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
      setIsAdmin(false)
      setIsTeamMember(false)
      setUserInfo(null)
    } finally {
      setAuthLoading(false)
    }
  }, [apiBase])

  // Global cleanup of expired chats (runs even when logged out)
  const globalCleanup = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-chat-cleanup-global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inactivityTimeout: INACTIVITY_TIMEOUT
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.deletedCount > 0) {
          console.log(`✅ Global cleanup: removed ${data.deletedCount} expired chat files`)
        }
      }
    } catch (error) {
      console.error('Error in global cleanup:', error)
    }
  }, [])

  // Initial auth check and periodic refresh
  useEffect(() => {
    checkAuthStatus(true) // Initial check

    // Run global cleanup on mount and periodically
    globalCleanup()
    const globalCleanupInterval = setInterval(() => {
      globalCleanup()
    }, 60000) // Every minute

    // Check auth status every 3 seconds to detect login/logout (without loading state)
    const authInterval = setInterval(() => {
      checkAuthStatus(false) // Periodic check - no loading state
    }, 3000)

    // Check auth when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthStatus(false) // No loading state on visibility change
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check auth on focus (user clicks on window)
    const handleFocus = () => {
      checkAuthStatus(false) // No loading state on focus
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(authInterval)
      clearInterval(globalCleanupInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [checkAuthStatus, globalCleanup])

  // Send chat history to Discord before deletion
  const sendHistoryToDiscord = useCallback(async (chat: ChatInstance) => {
    try {
      const duration = Math.round((Date.now() - chat.startTime) / 1000) // seconds
      const durationStr = `${Math.floor(duration / 60)}m ${duration % 60}s`

      const response = await fetch('/api/ai-chat-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: {
            chatId: chat.id,
            chatName: chat.name,
            messages: chat.messages,
            startTime: chat.startTime,
            endTime: Date.now(),
            duration: durationStr
          },
          userInfo: userInfo || undefined
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`Failed to send to Discord: ${response.status} ${errorText}`)
      }

      console.log('Chat history sent to Discord successfully:', chat.id)
    } catch (error) {
      console.error('Failed to send chat history to Discord:', error)
      throw error // Re-throw so caller knows it failed
    }
  }, [userInfo])

  // Track if Discord history has been sent for this chat
  const discordSentRef = useRef<Set<string>>(new Set())

  // Save chat to database file (while active)
  const saveChatToDB = useCallback(async (chat: ChatInstance) => {
    if (!userEmail) {
      console.warn('Cannot save chat: user email not available')
      return
    }

    try {
      const response = await fetch('/api/ai-chat-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat, userEmail })
      })

      if (!response.ok) {
        console.error('Failed to save chat to database:', chat.id)
      }
    } catch (error) {
      console.error('Error saving chat to database:', error)
    }
  }, [userEmail])

  // Check for expired chats and delete them
  const checkAndDeleteExpiredChats = useCallback(async () => {
    const currentTime = Date.now()
    const expiredChatIds = new Set<string>()

    // First, identify expired chats by checking current state
    setChats(prevChats => {
      prevChats.forEach(chat => {
        const timeRemaining = INACTIVITY_TIMEOUT - (currentTime - chat.lastActivity)
        if (timeRemaining <= 0) {
          expiredChatIds.add(chat.id)
        }
      })

      return prevChats // Don't modify state yet, just identify expired chats
    })

    // If there are expired chats, process them
    if (expiredChatIds.size > 0) {
      // Get the actual chat objects for expired chats
      const expiredChats: ChatInstance[] = []
      setChats(prevChats => {
        prevChats.forEach(chat => {
          if (expiredChatIds.has(chat.id)) {
            expiredChats.push(chat)
          }
        })
        return prevChats
      })

      console.log(`Found ${expiredChats.length} expired chats to delete:`, expiredChats.map(c => c.id))

      // Send all expired chats to Discord and await completion
      const savePromises = expiredChats.map(async (chat) => {
        if (!discordSentRef.current.has(chat.id)) {
          discordSentRef.current.add(chat.id)
          try {
            await sendHistoryToDiscord(chat)
            console.log('Expired chat saved to Discord:', chat.id)
          } catch (err) {
            console.error('Failed to send expired chat to Discord:', err)
            // Remove from sent set so it can retry
            discordSentRef.current.delete(chat.id)
          }
        }
      })

      // Wait for all Discord saves to complete (or fail)
      await Promise.allSettled(savePromises)

      // Delete chat files from database (after sending to Discord)
      if (userEmail) {
        const deletePromises = expiredChats.map(async (chat) => {
          try {
            const response = await fetch('/api/ai-chat-save', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chatId: chat.id, userEmail })
            })

            if (!response.ok) {
              console.error('Failed to delete expired chat file from database:', chat.id)
            } else {
              console.log('Deleted expired chat file from database:', chat.id)
            }
          } catch (error) {
            console.error('Error deleting expired chat file from database:', error)
          }
        })
        await Promise.allSettled(deletePromises)
      }

      // Now remove ALL expired chats from state at once
      setChats(prevChats => {
        const updated = prevChats.filter(c => !expiredChatIds.has(c.id))

        console.log(`Removing ${prevChats.length - updated.length} expired chats from UI`)

        // Update active chat if it was deleted
        if (activeChatId && expiredChatIds.has(activeChatId)) {
          if (updated.length > 0) {
            setActiveChatId(updated[0].id)
          } else {
            setActiveChatId(null)
          }
        }

        return updated
      })
    }
  }, [activeChatId, sendHistoryToDiscord, userEmail])

  // Cleanup expired chat files from database (not in memory)
  const cleanupExpiredFiles = useCallback(async () => {
    if (!userEmail) return

    try {
      console.log('Running cleanup for expired chat files, timeout:', INACTIVITY_TIMEOUT / 1000, 'seconds')
      const response = await fetch('/api/ai-chat-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          inactivityTimeout: INACTIVITY_TIMEOUT
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.deletedCount > 0) {
          console.log(`✅ Cleaned up ${data.deletedCount} expired chat files from database`)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cleanup failed:', errorData)
      }
    } catch (error) {
      console.error('Error cleaning up expired files:', error)
    }
  }, [userEmail])

  // Update countdown every second for real-time display and check for expired chats
  useEffect(() => {
    // Check for expired chats on mount (chats that expired while website was closed)
    checkAndDeleteExpiredChats()

    // Cleanup expired files from database on mount and periodically
    let cleanupInterval: NodeJS.Timeout | null = null
    if (userEmail) {
      cleanupExpiredFiles()
      // Cleanup every 30 seconds
      cleanupInterval = setInterval(() => {
        cleanupExpiredFiles()
      }, 30000)
    }

    countdownTimerRef.current = setInterval(() => {
      setCountdownUpdate(prev => prev + 1)
      // Also check for expired chats every second
      checkAndDeleteExpiredChats()
    }, 1000) // Update every second for real-time countdown

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
      if (cleanupInterval) {
        clearInterval(cleanupInterval)
      }
    }
  }, [checkAndDeleteExpiredChats, cleanupExpiredFiles, userEmail])

  // Delete chat after inactivity or manually
  const deleteChat = useCallback(async (chatId: string, sendToDiscord: boolean = true, isInactivity: boolean = false) => {
    // Get chat before deletion
    const chatToDelete = chats.find(c => c.id === chatId)

    // Send to Discord if needed (await to ensure it completes)
    if (chatToDelete && sendToDiscord && !discordSentRef.current.has(chatId)) {
      discordSentRef.current.add(chatId)
      try {
        await sendHistoryToDiscord(chatToDelete)
      } catch (error) {
        console.error('Failed to send chat history to Discord:', error)
      }
    }

    // Delete chat file from database (after sending to Discord)
    if (userEmail) {
      try {
        const response = await fetch('/api/ai-chat-save', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, userEmail })
        })

        if (!response.ok) {
          console.error('Failed to delete chat file from database:', chatId)
        }
      } catch (error) {
        console.error('Error deleting chat file from database:', error)
      }
    }

    // Remove chat from state and handle active chat switching
    setChats(prevChats => {
      const updated = prevChats.filter(c => c.id !== chatId)

      // If deleting active chat, switch to another or close
      if (activeChatId === chatId) {
        if (updated.length > 0) {
          setActiveChatId(updated[0].id)
        } else {
          setActiveChatId(null)
        }
      }

      return updated
    })

    // Clear timer
    const timer = inactivityTimersRef.current.get(chatId)
    if (timer) {
      clearTimeout(timer)
      inactivityTimersRef.current.delete(chatId)
    }

    // Show appropriate toast message
    if (isInactivity) {
      showToast('Chat deleted due to inactivity', 'info')
    } else {
      showToast('Chat deleted', 'success')
    }
    setShowDeleteConfirm(null)
  }, [chats, activeChatId, sendHistoryToDiscord, showToast])

  // Reset inactivity timer
  const resetInactivityTimer = useCallback((chatId: string) => {
    // Clear existing timer
    const existingTimer = inactivityTimersRef.current.get(chatId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      deleteChat(chatId, true, true)
    }, INACTIVITY_TIMEOUT)

    inactivityTimersRef.current.set(chatId, timer)
  }, [deleteChat])

  // Update cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setCooldownRemaining(prev => {
          if (prev <= 1000) {
            if (cooldownTimerRef.current) {
              clearInterval(cooldownTimerRef.current)
              cooldownTimerRef.current = null
            }
            return 0
          }
          return prev - 1000
        })
      }, 1000)
    }

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
      }
    }
  }, [cooldownRemaining])

  // Create new chat
  const createNewChat = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to use the AI chat', 'info')
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }
    if (chats.length >= MAX_CHATS) {
      showToast(`Maximum ${MAX_CHATS} chats allowed. Please delete one first.`, 'warning')
      return
    }

    const now = Date.now()
    const timeSinceLastCreation = now - lastChatCreation

    if (timeSinceLastCreation < CHAT_CREATION_COOLDOWN) {
      const remaining = Math.ceil((CHAT_CREATION_COOLDOWN - timeSinceLastCreation) / 1000)
      setCooldownRemaining(remaining * 1000)
      showToast(`Please wait ${remaining} seconds before creating a new chat.`, 'info')
      return
    }

    setLastChatCreation(now)
    setCooldownRemaining(0)

    const chatNumber = chats.length + 1
    const newChat: ChatInstance = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Chat ${chatNumber}`,
      messages: [
        {
          role: 'assistant',
          content: 'Hello! I\'m Fabbie, your AI assistant for the FabLab. How can I help you today?',
          timestamp: Date.now(),
          mode: 'normal'
        }
      ],
      startTime: Date.now(),
      lastActivity: Date.now(),
      createdAt: Date.now()
    }

    setChats(prev => {
      const updated = [...prev, newChat]
      // Save new chat to database
      saveChatToDB(newChat)
      return updated
    })

    setActiveChatId(newChat.id)
    resetInactivityTimer(newChat.id)
    setIsOpen(true)
    showToast('New chat created!', 'success')
  }

  // Switch to a different chat
  const switchChat = (chatId: string) => {
    setActiveChatId(chatId)
    resetInactivityTimer(chatId)
  }

  // Handle send message
  const handleSend = async (input: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to use the AI chat', 'info')
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (!input.trim() || !activeChatId || isGenerating) return
    setIsGenerating(true)

    const activeChat = chats.find(c => c.id === activeChatId)
    if (!activeChat) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    }

    let conversationHistory: ChatMessage[] = []

    // Add user message immediately and get conversation history
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === activeChatId) {
          const newMessages = [...chat.messages, userMessage]
          conversationHistory = newMessages
          const updatedChat = {
            ...chat,
            messages: newMessages,
            lastActivity: Date.now()
          }
          // Save updated chat to database
          saveChatToDB(updatedChat)
          return updatedChat
        }
        return chat
      })
      return updated
    })

    resetInactivityTimer(activeChatId)

    // Create a placeholder assistant message for streaming
    const streamingMessageId = `streaming-${Date.now()}`
    const placeholderMessage: ChatMessage = {
      role: 'assistant',
      content: '...',
      timestamp: Date.now(),
      mode: 'thinking'
    }

    // Add placeholder message
    setChats(prev => {
      const updated = prev.map(chat => {
        if (chat.id === activeChatId) {
          const updatedChat = {
            ...chat,
            messages: [...chat.messages, placeholderMessage],
            lastActivity: Date.now()
          }
          // Save updated chat to database
          saveChatToDB(updatedChat)
          return updatedChat
        }
        return chat
      })
      return updated
    })

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: conversationHistory.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          isAdmin: isAdmin,
          isTeamMember: isTeamMember
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''
      let finalMood: ChatMessage['mode'] = 'normal'

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.type === 'chunk') {
              accumulatedText += data.content

              // Update the streaming message in real-time
              // Replace "..." with actual content when first chunk arrives
              setChats(prev => {
                const updated = prev.map(chat => {
                  if (chat.id === activeChatId) {
                    const messages = [...chat.messages]
                    const lastMessage = messages[messages.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      messages[messages.length - 1] = {
                        ...lastMessage,
                        content: accumulatedText,
                        mode: 'thinking' // Show thinking while streaming
                      }
                    }
                    const updatedChat = {
                      ...chat,
                      messages,
                      lastActivity: Date.now()
                    }
                    // Save updated chat to database (throttle this in production)
                    saveChatToDB(updatedChat)
                    return updatedChat
                  }
                  return chat
                })
                return updated
              })
            } else if (data.type === 'done') {
              finalMood = (data.mood || 'normal') as ChatMessage['mode']
              const validModes: ChatMessage['mode'][] = ['normal', 'slightly_annoyed', 'searching', 'thinking', 'crying', 'sad', 'confused', 'heart_giving']
              if (!validModes.includes(finalMood)) {
                finalMood = 'normal'
              }

              // Update final message with complete text and mood
              setChats(prev => {
                const updated = prev.map(chat => {
                  if (chat.id === activeChatId) {
                    const messages = [...chat.messages]
                    const lastMessage = messages[messages.length - 1]
                    if (lastMessage && lastMessage.role === 'assistant') {
                      messages[messages.length - 1] = {
                        ...lastMessage,
                        content: data.fullText || accumulatedText,
                        mode: finalMood
                      }
                    }
                    const updatedChat = {
                      ...chat,
                      messages,
                      lastActivity: Date.now()
                    }
                    // Save final updated chat to database
                    saveChatToDB(updatedChat)
                    return updatedChat
                  }
                  return chat
                })
                return updated
              })
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Unknown error')
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            console.warn('Failed to parse chunk:', parseError)
          }
        }
      }
      
      // Safety check: Ensure the last message is no longer in "thinking" mode if the stream ended
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === activeChatId) {
            const messages = [...chat.messages]
            const lastMessage = messages[messages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.mode === 'thinking') {
              messages[messages.length - 1] = {
                ...lastMessage,
                mode: finalMood || 'normal'
              }
            }
            return { ...chat, messages }
          }
          return chat
        })
        return updated
      })

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
        mode: 'sad'
      }
      setChats(prev => {
        const updated = prev.map(chat => {
          if (chat.id === activeChatId) {
            // Remove placeholder ("...") and add error message
            const messages = chat.messages.filter((msg, idx) =>
              !(idx === chat.messages.length - 1 && msg.role === 'assistant' && (msg.content === '' || msg.content === '...'))
            )
            const updatedChat = {
              ...chat,
              messages: [...messages, errorMessage],
              lastActivity: Date.now()
            }
            // Save updated chat to database
            saveChatToDB(updatedChat)
            return updatedChat
          }
          return chat
        })
        return updated
      })
    } finally {
      setIsGenerating(false)
    }

    resetInactivityTimer(activeChatId)
  }

  // Get active chat
  const activeChat = chats.find(c => c.id === activeChatId)

  // Get current mood from the last assistant message in active chat
  const currentMood = activeChat?.messages
    ?.filter(m => m.role === 'assistant')
    .slice(-1)[0]?.mode || 'normal'

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      inactivityTimersRef.current.forEach(timer => clearTimeout(timer))
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [])

  // Scroll to bottom when messages change
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (activeChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [activeChat?.messages])

  return (
    <>
      {/* Floating Button - Hidden on mobile when chat is open */}
      {(!isOpen || !isMobile) && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsOpen(!isOpen)
            if (!isOpen && chats.length === 0 && isAuthenticated) {
              createNewChat()
            } else if (!isOpen && activeChatId) {
              resetInactivityTimer(activeChatId)
            }
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-16 h-16 sm:w-14 sm:h-14 bg-gradient-to-r from-fablab-primary to-fablab-accent text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-[9999] touch-manipulation"
          aria-label="Open AI Assistant"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-8 h-8 sm:w-7 sm:h-7" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="w-8 h-8 sm:w-7 sm:h-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[800px] sm:h-[calc(100vh-8rem)] sm:max-h-[700px] sm:rounded-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col z-[9998] border-0 sm:border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-fablab-primary to-fablab-accent text-white p-3 sm:p-4 sm:rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ChibiIcon mode={currentMood} size="w-12 h-12 sm:w-11 sm:h-11" />
                <h3 className="font-semibold text-base sm:text-lg">Fabbie</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 rounded-full p-2 sm:p-1 transition-colors touch-manipulation"
                aria-label="Close chat"
              >
                <X className="w-7 h-7 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden flex-col sm:flex-row min-h-0">
              {/* Sidebar - Chat List */}
              <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-row sm:flex-col overflow-x-auto sm:overflow-y-auto flex-shrink-0 sm:flex-shrink">
                <div className="p-2 sm:p-3 border-r sm:border-r-0 sm:border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  {authLoading ? (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 sm:px-3 py-2 rounded-lg flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium whitespace-nowrap">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      <span>Loading...</span>
                    </div>
                  ) : !isAuthenticated ? (
                    <Link
                      href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                      className="w-full bg-fablab-primary text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-fablab-accent transition-colors flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation"
                    >
                      <User className="w-5 h-5 sm:w-5 sm:h-5" />
                      <span>Sign In</span>
                    </Link>
                  ) : (
                    <button
                      onClick={createNewChat}
                      disabled={chats.length >= MAX_CHATS || cooldownRemaining > 0}
                      className="w-full bg-fablab-primary text-white px-2 sm:px-3 py-2 rounded-lg hover:bg-fablab-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm font-medium whitespace-nowrap touch-manipulation"
                    >
                      <Plus className="w-5 h-5 sm:w-5 sm:h-5" />
                      <span>{cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'New Chat'}</span>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-x-auto sm:overflow-y-auto flex sm:flex-col">
                  {chats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === activeChatId}
                      onSwitch={() => switchChat(chat.id)}
                      onDelete={() => setShowDeleteConfirm(chat.id)}
                      countdownUpdate={countdownUpdate}
                      inactivityTimeout={INACTIVITY_TIMEOUT}
                      deleteChat={deleteChat}
                    />
                  ))}
                  {chats.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No chats yet. Create one to get started!
                    </div>
                  )}
                </div>
              </div>

              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {activeChat ? (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
                      {activeChat.messages.map((msg, idx) => {
                        // Ensure message has mode field (for backward compatibility)
                        // IMPORTANT: Check if mode exists directly on the message object
                        const messageMode = (msg as any).mode || msg.mode || 'normal'
                        const messageWithMode: ChatMessage = {
                          ...msg,
                          mode: messageMode as ChatMessage['mode']
                        }

                        const messageKey = `msg-${msg.timestamp}-${idx}`
                        const modeKey = String(messageWithMode.mode || 'normal').trim()

                        // Debug: Log mode for assistant messages
                        if (messageWithMode.role === 'assistant') {
                          console.log(`[RENDER] Message ${idx}:`, {
                            originalMode: msg.mode,
                            messageMode: messageMode,
                            finalMode: modeKey,
                            messageKeys: Object.keys(msg),
                            hasModeProp: 'mode' in msg,
                            fullMessage: msg
                          })
                        }

                        return (
                          <motion.div
                            key={messageKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${messageWithMode.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[80%] ${messageWithMode.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                                }`}
                            >
                              {messageWithMode.role === 'user' ? (
                                <div
                                  className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-fablab-primary text-white"
                                >
                                  <User className="w-5 h-5 sm:w-5 sm:h-5" />
                                </div>
                              ) : (
                                <div className="flex-shrink-0">
                                  <ChibiIcon
                                    mode={modeKey}
                                    size="w-14 h-14 sm:w-12 sm:h-12"
                                    messageId={messageKey}
                                  />
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-2 ${messageWithMode.role === 'user'
                                    ? 'bg-fablab-primary text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                  }`}
                              >
                                {messageWithMode.role === 'assistant' ? (
                                  <div
                                    className="text-xs sm:text-sm whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{
                                      __html: (() => {
                                        let content = messageWithMode.content
                                        const origin = typeof window !== 'undefined' ? window.location.origin : ''

                                        // Remove any placeholder-like text that shouldn't be there
                                        content = content.replace(/__?LINK\d+__?/g, '')

                                        // Convert markdown-style bold (**text**) - but not within HTML tags
                                        content = content.replace(/(?<!<[^>]*)\*\*([^*]+)\*\*(?![^<]*>)/g, '<strong>$1</strong>')

                                        // Convert markdown-style italic (*text* or _text_) - but not within HTML tags
                                        content = content.replace(/(?<!<[^>]*)\*([^*]+)\*(?![^<]*>)/g, '<em>$1</em>')
                                        content = content.replace(/(?<!<[^>]*)_([^_]+)_(?![^<]*>)/g, '<em>$1</em>')

                                        // Convert numbered lists (preserve structure)
                                        const lines = content.split('\n')
                                        let inList = false
                                        let listItems: string[] = []
                                        let processedLines: string[] = []

                                        lines.forEach((line) => {
                                          // Skip if line contains HTML tags (likely already formatted)
                                          if (line.includes('<a') || line.includes('</a>')) {
                                            if (inList) {
                                              processedLines.push(`<ul>${listItems.join('')}</ul>`)
                                              listItems = []
                                              inList = false
                                            }
                                            processedLines.push(line)
                                            return
                                          }

                                          const numberedMatch = line.match(/^(\d+)\.\s+(.+)$/)
                                          const bulletMatch = line.match(/^[-•]\s+(.+)$/)

                                          if (numberedMatch || bulletMatch) {
                                            if (!inList) {
                                              inList = true
                                              listItems = []
                                            }
                                            listItems.push(`<li>${numberedMatch ? numberedMatch[2] : bulletMatch![1]}</li>`)
                                          } else {
                                            if (inList) {
                                              processedLines.push(`<ul>${listItems.join('')}</ul>`)
                                              listItems = []
                                              inList = false
                                            }
                                            processedLines.push(line)
                                          }
                                        })

                                        if (inList && listItems.length > 0) {
                                          processedLines.push(`<ul>${listItems.join('')}</ul>`)
                                        }

                                        content = processedLines.join('\n')

                                        // Process and fix links - handle both HTML links and markdown-style links
                                        content = content.replace(
                                          /<a\s+href="([^"]*)"([^>]*)>(.*?)<\/a>/g,
                                          (match, url, attrs, linkText) => {
                                            // Handle relative URLs (starting with #)
                                            let finalUrl = url

                                            if (url.startsWith('#')) {
                                              finalUrl = `${origin}${url}`
                                            }

                                            // Add styles if not already present
                                            const hasStyle = attrs && attrs.includes('style=')
                                            const styleAttr = hasStyle ? '' : ' style="color: #0f766e; text-decoration: underline; font-weight: 600;"'

                                            // Determine target attribute
                                            const isInternal = url.startsWith('#') || (origin && url.startsWith(origin))
                                            const targetAttr = isInternal
                                              ? ' target="_self"'
                                              : ' target="_blank" rel="noopener noreferrer"'

                                            return `<a href="${finalUrl}"${targetAttr}${styleAttr}${attrs || ''}>${linkText}</a>`
                                          }
                                        )

                                        // Replace newlines with breaks (but not within HTML tags)
                                        content = content.replace(/\n(?!<[^>]*>)/g, '<br>')

                                        return content
                                      })()
                                    }}
                                  />
                                ) : (
                                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{messageWithMode.content}</p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <ChatInput
                      onSend={handleSend}
                      isStreaming={isGenerating}
                    />
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex justify-center">
                        <ChibiIcon mode="normal" size="w-16 h-16" className="text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {!isAuthenticated
                          ? 'Please sign in to start chatting with Fabbie'
                          : 'Select a chat or create a new one to start'
                        }
                      </p>
                      {authLoading ? (
                        <div className="inline-flex items-center justify-center space-x-2 px-8 py-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-fablab-primary"></div>
                          <span className="text-gray-600 dark:text-gray-400">Checking...</span>
                        </div>
                      ) : !isAuthenticated ? (
                        <Link
                          href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-fablab-primary to-fablab-accent text-white px-8 py-3 rounded-lg hover:from-fablab-accent hover:to-fablab-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium min-w-[200px]"
                        >
                          <LogIn className="w-5 h-5" />
                          <span>Sign In</span>
                        </Link>
                      ) : (
                        <button
                          onClick={createNewChat}
                          className="bg-fablab-primary text-white px-6 py-2 rounded-lg hover:bg-fablab-accent transition-colors"
                        >
                          Create New Chat
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm min-w-[280px] max-w-[400px] ${toast.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : toast.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
                    : toast.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : toast.type === 'error' || toast.type === 'warning' ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close notification"
              >
                <X className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Delete Chat?
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteChat(showDeleteConfirm, true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Input component
const ChatInput = ({ onSend, isStreaming }: { onSend: (input: string) => void, isStreaming?: boolean }) => {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return

    const message = input.trim()
    setInput('')
    await onSend(message)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
      <div className="flex space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isStreaming ? "AI is responding..." : "Type your message..."}
          disabled={isStreaming}
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fablab-primary disabled:opacity-50 touch-manipulation"
        />
        <button
          onClick={handleSubmit}
          disabled={isStreaming || !input.trim()}
          className="bg-fablab-primary text-white px-4 sm:px-4 py-2.5 sm:py-2 rounded-lg hover:bg-fablab-accent active:bg-fablab-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 touch-manipulation min-w-[44px]"
          aria-label="Send message"
        >
          {isStreaming ? (
            <div className="w-5 h-5 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </div>
  )
}

export default AIChat
