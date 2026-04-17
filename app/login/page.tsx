'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, ArrowLeft, Sparkles, Shield, User, Eye, EyeOff, Phone, GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [grade, setGrade] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [signupMethod, setSignupMethod] = useState<'none' | 'email'>('none')
  const searchParams = useSearchParams()

  const apiBase = process.env.NEXT_PUBLIC_API_BASE

  // Egyptian phone number validation
  const validateEgyptianPhone = (phone: string) => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    
    // Egyptian phone number patterns:
    // +201234567890 (with country code)
    // 01234567890 (without country code)
    // 201234567890 (with country code but no +)
    const patterns = [
      /^\+201[0-9]{9}$/, // +20 followed by 1 and 9 digits
      /^01[0-9]{9}$/,    // 01 followed by 9 digits
      /^201[0-9]{9}$/    // 20 followed by 1 and 9 digits
    ]
    
    return patterns.some(pattern => pattern.test(cleaned))
  }

  useEffect(() => {
    // Simulate page loading
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // After successful login/signup, redirect back if provided
  function redirectBack() {
    const redirect = searchParams?.get('redirect')
    if (redirect) {
      // if draft flag present, keep hash and restore draft via sessionStorage in booking
      router.push(decodeURIComponent(redirect))
    } else {
      router.push('/')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Handle verification code submission
    if (requiresVerification) {
      if (!verificationCode) {
        setError('Please enter the verification code')
        return
      }
      
      setLoading(true)
      try {
        const res = await fetch(`${apiBase}/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: pendingEmail, code: verificationCode })
        })

        const data = await res.json().catch(() => ({}))
        if (!res.ok || data?.error) {
          setError(data?.error || 'Verification failed')
          return
        }

        setSuccess('Email verified successfully! Your account has been created.')
        setTimeout(() => redirectBack(), 1000)
      } catch (err) {
        setError('Network error, please try again')
      } finally {
        setLoading(false)
      }
      return
    }

    // Regular login/signup validation
    if (!email || !password || (!isLogin && (!fullName || !confirmPassword || !grade || !phone))) {
      setError('Please fill in all required fields')
      return
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!isLogin && !validateEgyptianPhone(phone)) {
      setError('Please enter a valid Egyptian phone number (e.g., +201234567890 or 01234567890)')
      return
    }

    setLoading(true)
    try {
      const endpoint = isLogin ? '/login' : '/signup'
      const body = isLogin
        ? { email, password }
        : { 
            email, 
            username: fullName, 
            password, 
            confirmPassword, 
            grade, 
            phone,
            isStemQena: email.endsWith('@stemqena.moe.edu.eg')
          }

      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) {
        setError(data?.error || 'Request failed')
        return
      }

      // Check if verification is required
      if (data.requiresVerification) {
        setRequiresVerification(true)
        setPendingEmail(email)
        setSuccess('Verification code sent to your email. Please check your inbox.')
        return
      }

      setSuccess(isLogin ? 'Logged in successfully' : 'Account created successfully')
      setTimeout(() => redirectBack(), 600)
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleResendCode() {
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: pendingEmail })
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to resend code')
        return
      }

      setSuccess('New verification code sent to your email.')
    } catch (err) {
      setError('Network error, please try again')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4 overflow-x-hidden py-4">
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Background Orbs */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl overflow-hidden"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none fixed -bottom-40 -left-40 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-100/50 to-green-100/50 rounded-full blur-3xl overflow-hidden"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 w-full overflow-x-hidden">
          {/* Header */}
          <div className="flex items-center justify-start mb-6 sm:mb-10">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* Left: Pitch - Hidden on mobile for better UX */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden lg:block"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                {isLogin ? 'Sign in to unlock' : 'Join our community'}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {isLogin ? ' capstone videos' : ' and start creating'}
                </span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-xl">
                {isLogin 
                  ? 'Access member-only deep dives: architecture, UX flows, and full demos. Stay tuned for new drops.'
                  : 'Connect with fellow makers, share your projects, and access exclusive resources and workshops.'
                }
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Secure by design</div>
                <div className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Smooth experience</div>
              </div>
            </motion.div>

            {/* Right: Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 }}
              className="relative w-full max-w-md mx-auto lg:max-w-none overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-y-auto"
            >
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-2xl lg:rounded-3xl shadow-xl overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(59, 130, 246, 0.1)' }}>
                {/* Toggle Buttons */}
                <div className="flex border-b border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      isLogin 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setIsLogin(false); setSignupMethod('none') }}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      !isLogin 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">
                        {requiresVerification ? 'Verify your email' : (isLogin ? 'Member Login' : 'Create Account')}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {requiresVerification 
                          ? `We sent a 6-digit code to ${pendingEmail || email}. Enter it below to complete signup.`
                          : (isLogin ? 'Enter your credentials to continue' : 'Join our community today')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Signup method chooser (below heading) */}
                {!isLogin && !requiresVerification && signupMethod === 'none' && (
                  <div className="space-y-3 mb-6 px-4 sm:px-6 lg:px-8">
                    <a
                      href={`${apiBase}/auth/google/login`}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-white text-gray-800 border border-gray-300 hover:border-gray-400 hover:shadow-sm py-2.5 transition-all dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:border-gray-600"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/225px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-medium">Sign up with Google</span>
                    </a>
                    {/* Email signup button - Hidden but code preserved for future use */}
                    {/* Uncomment the lines below to re-enable email signup */}
                    {false && (
                      <>
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>
                    <button
                      type="button"
                      onClick={() => setSignupMethod('email')}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 hover:opacity-95 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign up with Email</span>
                    </button>
                      </>
                    )}
                  </div>
                )}

                {!requiresVerification && (isLogin || signupMethod === 'email') && (
                <form className="p-4 sm:p-8 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-hidden" onSubmit={handleSubmit}>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">{success}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Your name"
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            error && !fullName ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="e.g. +201234567890"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            error && !phone ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={grade}
                          onChange={e => setGrade(e.target.value)}
                          className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            error && !grade ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                          }`}
                        >
                          <option value="">Select your grade</option>
                          <option value="G10">Grade 10</option>
                          <option value="G11">Grade 11</option>
                          <option value="G12">Grade 12</option>
                        </select>
                      </div>
                    </div>
                  )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={`w-full pl-11 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          error && !email ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                        }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className={`w-full pl-11 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                          error && !password ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {!isLogin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                          type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          className={`w-full pl-11 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                            error && !confirmPassword ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-600'
                          }`}
                    />
                  </div>
                </div>
                  )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {loading && (
                    <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <span className={loading ? 'opacity-0' : 'opacity-100'}>
                    {loading 
                      ? (requiresVerification ? 'Verifying...' : (isLogin ? 'Signing in...' : 'Creating account...'))
                      : (requiresVerification ? 'Verify Email' : (isLogin ? 'Sign in' : 'Create account'))
                    }
                  </span>
                </button>

                {/* Sign in with Google below submit (sign-in only) */}
                {!requiresVerification && isLogin && (
                  <div className="mt-4 flex flex-col items-stretch gap-2">
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">or</div>
                    <a
                      href={`${apiBase}/auth/google/login`}
                      className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-gray-800 border border-gray-300 hover:border-gray-400 hover:shadow-sm py-3 transition-all dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:hover:border-gray-600"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/225px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5" />
                      </span>
                      <span className="text-sm font-medium">Sign in with Google</span>
                    </a>
                  </div>
                )}

                  <div className="text-center text-sm text-gray-500">
                    {isLogin ? (
                      <>
                        Don&apos;t have an account?{' '}
                        <button type="button" onClick={() => setIsLogin(false)} className="text-blue-600 dark:text-blue-400 hover:underline">Sign up</button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button type="button" onClick={() => setIsLogin(true)} className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</button>
                      </>
                    )}
                  </div>
              </form>
              )}

              {requiresVerification && (
                <form className="p-4 sm:p-8 space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overflow-hidden" onSubmit={handleSubmit}>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-sm"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">{success}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Code</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full py-3 px-4 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition border-gray-300 dark:border-gray-600 focus:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg font-mono tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                      >
                        Didn't receive the code? Resend
                      </button>
                  </div>
                </div>

                <button
                  type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    {loading && (
                      <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <span className={loading ? 'opacity-0' : 'opacity-100'}>
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </span>
                </button>
              </form>
              )}
              </div>
            </motion.div>
        </div>
      </div>
      
      {/* Creator Credit - Bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
        className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none px-4"
      >
        <a
          href="tel:+201153106449"
          className="pointer-events-auto text-xs text-gray-500 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 group"
          title="Contact Yousef Gaber - Website Creator"
        >
          <span className="opacity-70 dark:opacity-90 group-hover:opacity-100 whitespace-nowrap">Made with ❤️ by</span>
          <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent whitespace-nowrap">
            Yousef Gaber
          </span>
        </a>
      </motion.div>
      </div>
    </main>
  )
}
