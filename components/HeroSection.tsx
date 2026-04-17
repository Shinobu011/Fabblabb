'use client'

import { motion } from 'framer-motion'
import { Sparkles, Lightbulb, Zap, GraduationCap, Wrench } from 'lucide-react'

const HeroSection = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-100/30 to-purple-100/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-orange-100/30 to-green-100/30 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Header Section with Logos */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-16"
          >
            {/* Main Header */}
            <div className="mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-8"
              >
              </motion.div>

              {/* Partnership Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-center"
              >
              </motion.div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 dark:text-white mb-6 leading-tight"
            >
              Where{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Innovation
              </span>{' '}
              Meets{' '}
              <span className="bg-gradient-to-r from-orange-500 to-green-500 bg-clip-text text-transparent">
                Creativity
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative mb-8"
            >
              <blockquote className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 italic leading-relaxed">
                <div className="flex items-start justify-center space-x-3">
                  <Lightbulb className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 flex-shrink-0 mt-1" />
                  <span>"The best way to predict the future is to invent it. Welcome to our FabLab, where ideas come to life."</span>
                </div>
              </blockquote>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed px-4"
            >
              Our FabLab is a cutting-edge maker space equipped with the latest technology including 3D printers, 
              laser cutters, CNC machines, and more. We provide students with the tools and knowledge to turn their 
              innovative ideas into reality, fostering creativity, problem-solving, and hands-on learning.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            >
              <motion.a
                href="#machines"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Explore Machines</span>
              </motion.a>
              
              <motion.a
                href="#booking"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <span>Book a Session</span>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Floating Icons - Hidden on mobile for better performance */}
          <div className="absolute top-20 -left-2 sm:left-0 hidden md:block">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100/50 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </motion.div>
          </div>
          
          <div className="absolute top-40 right-0 sm:right-4 hidden md:block">
            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100/50 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}

export default HeroSection
