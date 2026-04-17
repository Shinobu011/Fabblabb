'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Phone, GraduationCap, Lock, Mail, Eye, EyeOff, ArrowLeft, Shield, Sparkles } from 'lucide-react'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const apiBase = process.env.NEXT_PUBLIC_API_BASE

  const [username, setUsername] = useState('')
  const [grade, setGrade] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const loadPending = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/pending`, { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data?.email) {
          router.push('/')
          return
        }
        if (!cancelled) {
          setEmail(data.email)
        }
      } finally {
        if (!cancelled) setPageLoading(false)
      }
    }
    loadPending()
    return () => { cancelled = true }
  }, [apiBase, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, grade, phone, password, confirmPassword })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.error) {
        setError(data?.error || 'Failed to complete profile')
        return
      }
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center overflow-hidden">
      <div className="relative w-full mx-auto overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-40 -left-40 w-[28rem] h-[28rem] bg-gradient-to-r from-orange-100/50 to-green-100/50 rounded-full blur-3xl"></div>
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
          <div className="flex items-center justify-start mb-6 sm:mb-10">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="hidden lg:block">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                Finish setting up
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> your account</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-xl">
                Add your details to get personalized access and keep your team in sync.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Secure by design</div>
                <div className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Smooth experience</div>
              </div>
            </div>
            <div className="w-full max-w-2xl mx-auto lg:max-w-3xl relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25"></div>
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800 rounded-2xl shadow-xl p-6 sm:p-8">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">Complete your profile</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Just one step left to finish signing in.</p>
                    </div>
                  </div>
                </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input className="w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-gray-100 dark:bg-gray-800 text-gray-500" value={email} readOnly />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${error && !username ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`} value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${error && !phone ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`} value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +201234567890" />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Egyptian numbers only: +20, 012..., or 201...</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select className={`w-full pl-11 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${error && !grade ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`} value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="">Select your grade</option>
                <option value="G10">Grade 10</option>
                <option value="G11">Grade 11</option>
                <option value="G12">Grade 12</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} className={`w-full pl-11 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${error && !password ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} className={`w-full pl-11 pr-10 py-3 rounded-xl border focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${(error && !confirmPassword) || (password && confirmPassword && password !== confirmPassword) ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
            )}
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 text-white rounded-xl py-3 font-medium shadow disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


