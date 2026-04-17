'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import GallerySlider from '@/components/GallerySlider'
import MachinesSlider from '@/components/MachinesSlider'
import TeamSection from '@/components/TeamSection'
import BookingSection from '@/components/BookingSection'
import VideosSection from '@/components/VideosSection'
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa'

export default function Home() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    // Add smooth scrolling behavior
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement
      if (target.hash) {
        e.preventDefault()
        const element = document.querySelector(target.hash)
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }
    }

    // Add event listeners to all anchor links
    const links = document.querySelectorAll('a[href^="#"]')
    links.forEach(link => {
      link.addEventListener('click', handleSmoothScroll)
    })

    return () => {
      clearTimeout(timer)
      links.forEach(link => {
        link.removeEventListener('click', handleSmoothScroll)
      })
    }
  }, [])

  // Ensure navigating to /#booking (or any hash) scrolls after loading completes
  useEffect(() => {
    if (loading) return
    const scrollToHash = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      if (hash) {
        const el = document.querySelector(hash)
        if (el) {
          // slight delay to ensure sections are in DOM and laid out
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 50)
        }
      }
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <GallerySlider />
      <MachinesSlider />
      <VideosSection />
      <TeamSection />
      <BookingSection />
      
      {/* Footer */}
      <footer className="bg-fablab-dark dark:bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">STEM Qena FabLab</h3>
              <p className="text-gray-300 dark:text-gray-400 mb-4">
                Where innovation meets creativity. Join us in building the future, one project at a time.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#home" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#gallery" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Gallery</a></li>
                <li><a href="#machines" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Machines</a></li>
                <li><a href="#videos" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Videos</a></li>
                <li><a href="#team" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Team</a></li>
                <li><a href="#booking" className="text-gray-300 dark:text-gray-400 hover:text-white transition-colors">Booking</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300 dark:text-gray-400">
                <p>New Qena City, Qena, Egypt</p>
                <p>fablabqena@gmail.com</p>
                <p>+20 100 100 1891</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.facebook.com/profile.php?id=61573423239442&locale=ar_AR" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-300 dark:text-gray-400 hover:text-white transition-colors">
                    <FaFacebook /> Facebook
                  </a>
                </li>
                <li>
                  <a href="https://www.instagram.com/fablab_qena/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-300 dark:text-gray-400 hover:text-white transition-colors">
                    <FaInstagram /> Instagram
                  </a>
                </li>
                <li>
                  <a href="https://www.tiktok.com/@fablab_qena" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-300 dark:text-gray-400 hover:text-white transition-colors">
                    <FaTiktok /> TikTok
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@fablab-qena" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-gray-300 dark:text-gray-400 hover:text-white transition-colors">
                    <FaYoutube /> YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 dark:border-gray-600 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-gray-300 dark:text-gray-400 text-sm">
              <p>&copy; 2025 STEM Qena FabLab. All rights reserved.</p>
              <span className="hidden md:inline">•</span>
              <a 
                href="tel:+201153106449" 
                className="hover:text-white dark:hover:text-gray-200 transition-colors duration-200 flex items-center gap-1.5 group"
              >
                <span className="opacity-80 group-hover:opacity-100">Made with ❤️ by</span>
                <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                  Yousef Gaber
                </span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
