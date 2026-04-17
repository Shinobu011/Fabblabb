'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, Users, Calendar, Wrench, Image, LogIn, LogOut, User, ChevronDown, Play, Settings } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<{username: string, email: string, grade: string} | null>(null)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isTeamMember, setIsTeamMember] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE
        
        // Check authentication status
        const authRes = await fetch(`${apiBase}/auth/status`, {
          credentials: 'include'
        })
        const authData = await authRes.json()
        
        if (authData.authenticated) {
          setUser(authData.user)
          
          // Check admin status
          try {
            const adminRes = await fetch(`${apiBase}/admin/status`, { credentials: 'include' })
            const adminData = await adminRes.json()
            setIsAdmin(adminData.isAdmin || false)
          } catch (err) {
            setIsAdmin(false)
          }
          
          // Check team member status
          try {
            const teamRes = await fetch(`${apiBase}/admin/team/status`, { credentials: 'include' })
            const teamData = await teamRes.json()
            setIsTeamMember(teamData.isTeamMember || false)
          } catch (err) {
            setIsTeamMember(false)
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownOpen && !(event.target as Element).closest('.user-dropdown')) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userDropdownOpen])

  const handleLogout = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE
      await fetch(`${apiBase}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      setUserDropdownOpen(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const navItems = [
    { name: 'Home', href: '#home', icon: Home },
    { name: 'Gallery', href: '#gallery', icon: Image },
    { name: 'Machines', href: '#machines', icon: Wrench },
    { name: 'Team', href: '#team', icon: Users },
    { name: 'Booking', href: '#booking', icon: Calendar },
    ...(user ? [{ name: 'Videos', href: '/videos', icon: Play }] : []),
  ]

  // Add dashboard link based on user permissions
  const dashboardLink = []
  if (user && (isAdmin || isTeamMember)) {
    if (isAdmin) {
      dashboardLink.push({ name: 'Dashboard', href: '/admin', icon: Settings })
    } else if (isTeamMember) {
      dashboardLink.push({ name: 'Dashboard', href: '/admin/team', icon: Settings })
    }
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10">
              <img 
                src="/images/logos/fablab-logo.png" 
                alt="FabLab Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                FabLab Qena
              </span>
              <a 
                href="tel:+201153106449" 
                className="hidden md:block text-[10px] text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
                title="Contact Yousef Gaber"
              >
                by Yousef Gaber
              </a>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navItems.map((item) => (
              item.href.startsWith('#') ? (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium text-sm lg:text-base"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </motion.a>
              ) : (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium text-sm lg:text-base cursor-pointer"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </motion.div>
                </Link>
              )
            ))}
            {dashboardLink.map((item) => (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium text-sm lg:text-base cursor-pointer"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </motion.div>
              </Link>
            ))}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Authentication Section */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative user-dropdown">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium text-sm lg:text-base"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="hidden lg:block max-w-20 truncate">{user?.username?.split(' ')[0] || user?.username}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                    </motion.button>
                    
                    {/* User Dropdown */}
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                        >
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user?.username}>{user?.username}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user?.email}>{user?.email}</p>
                            {user?.grade && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{user.grade}</p>
                            )}
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm lg:text-base hover:shadow-lg transition-all duration-200"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login</span>
                    </motion.button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-t border-gray-200/50 dark:border-gray-700/50 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-1 pb-[env(safe-area-inset-bottom)]">
              {navItems.map((item, index) => (
                item.href.startsWith('#') ? (
                <motion.a
                  key={item.name}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </motion.a>
                ) : (
                  <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </motion.div>
                  </Link>
                )
              ))}
              {dashboardLink.map((item, index) => (
                <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navItems.length + index) * 0.1 }}
                    className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              ))}
              
              {/* Mobile Theme Toggle */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (navItems.length + dashboardLink.length) * 0.1 }}
                className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4"
              >
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                  <ThemeToggle />
                </div>
              </motion.div>
              
              {/* Mobile Authentication */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 pb-6"
                >
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user?.username}>{user?.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user?.email}>{user?.email}</p>
                        {user?.grade && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{user.grade}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 py-3 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition-all duration-200">
                        <LogIn className="w-5 h-5" />
                        <span className="font-medium">Login</span>
                      </div>
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

export default Navbar
