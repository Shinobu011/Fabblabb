'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Brain, Wifi, Gauge, AlertCircle, Leaf, Zap, TestTube, 
  TrendingUp, Camera, ArrowRight, Activity, Users, Car
} from 'lucide-react'

export default function ITOPlusHome() {

  const systemFeatures = [
    {
      icon: Camera,
      title: 'Real-Time Sensing',
      description: 'Camera modules, IR speed-detection gates, and MQ-135 air-quality sensors continuously measure vehicle count, speed, pedestrian flow, and CO₂ concentration.',
      color: 'from-cyan-500 to-blue-500',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
    },
    {
      icon: Brain,
      title: 'ML Algorithms',
      description: 'Vehicle recognition, emergency-vehicle detection, and accident prediction powered by advanced machine learning.',
      color: 'from-purple-500 to-indigo-500',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
    },
    {
      icon: Gauge,
      title: 'Intelligent Control',
      description: 'Signal timings and lane permissions are adjusted automatically based on real-time conditions and predictive analytics.',
      color: 'from-blue-500 to-cyan-500',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'
    },
    {
      icon: Wifi,
      title: 'V2V & V2I Communication',
      description: 'Smart vehicles harmonize with the road system for enhanced safety, routing, and traffic flow optimization.',
      color: 'from-indigo-500 to-purple-500',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
    },
  ]

  const stats = [
    { value: '58.3%', label: 'Trip Time Reduction', icon: TrendingUp },
    { value: '85.9%', label: 'Wait Time Reduction', icon: Activity },
    { value: '~300%', label: 'Traffic Flow Enhancement', icon: ArrowRight },
    { value: '51.6%', label: 'Emission & Pollution Decrease', icon: Leaf },
  ]

  const results = [
    { metric: 'Trip Time Reduction', value: '58.3%', description: 'Change in Velocity-time and Position-time graphs' },
    { metric: 'Wait Time Reduction', value: '85.9%', description: 'At intersection points' },
    { metric: 'Traffic Flow Enhancement', value: '~300%', description: 'Supported by system accuracy' },
    { metric: 'Car Density Accuracy', value: '89.2%', description: 'From camera measurements' },
    { metric: 'Accident Prediction Accuracy', value: '80%', description: 'From machine learning decisions' },
    { metric: 'Speed Violation Detection', value: '~97%', description: 'Detection accuracy' },
    { metric: 'Processing Time Response', value: '1.46s', description: 'Average response time' },
    { metric: 'Emission & Pollution Decrease', value: '51.6%', description: 'Environmental impact' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-60 -right-60 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.4, 1],
            x: [0, -40, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-60 -left-60 w-[700px] h-[700px] bg-gradient-to-r from-indigo-600/30 to-blue-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, 80, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Glassy Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-blue-950/40 border-b border-cyan-500/20 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  ITO<sub className="text-lg text-cyan-400">+</sub>
                </h1>
                <p className="text-xs text-blue-300/70">Intelligent Traffic Observer</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
              <span className="hidden sm:block text-sm text-blue-200/80">Greater Cairo</span>
              <Link href="/capstone/test">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-400/30 rounded-full text-sm font-semibold text-white hover:border-cyan-400/50 transition-all duration-300 flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline">Test System</span>
                  <span className="sm:hidden">Test</span>
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop"
              alt="Traffic in Greater Cairo"
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-blue-950/75 to-slate-950/85" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-cyan-900/50 to-indigo-900/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight"
            >
              <span className="block mb-2">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  ITO<sub className="text-cyan-400">+</sub>
                </span>
              </span>
              <span className="block text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl mt-4">
                Intelligent Traffic Observer
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-blue-200/90 max-w-4xl mx-auto mb-12 leading-relaxed"
            >
              Revolutionizing traffic management in Greater Cairo through{' '}
              <span className="text-cyan-300 font-semibold">IoT sensors</span>,{' '}
              <span className="text-blue-300 font-semibold">machine learning</span>, and{' '}
              <span className="text-indigo-300 font-semibold">adaptive control systems</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/capstone/test">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 211, 238, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 backdrop-blur-2xl border-2 border-cyan-400/40 rounded-full font-semibold text-lg text-white shadow-2xl hover:border-cyan-400/60 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <TestTube className="w-6 h-6" />
                    Test System
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 to-blue-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />
                </motion.button>
              </Link>
            </motion.div>

          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-blue-300/70"
          >
            <span className="text-sm">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 rotate-90" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="backdrop-blur-2xl bg-blue-950/40 border border-cyan-500/20 rounded-2xl p-6 text-center hover:border-cyan-400/40 transition-all duration-300"
              >
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
                  className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-blue-200/80">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-2xl bg-gradient-to-br from-blue-950/50 to-indigo-950/50 border-2 border-blue-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-400/30 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                  The Challenge
                </h2>
              </motion.div>
              
              <div className="space-y-6 text-blue-100/90 text-lg leading-relaxed">
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Egypt is currently facing severe urban and environmental challenges due to increasing traffic congestion, 
                  rising vehicle density, and continuous urban expansion. These problems have been accelerated significantly by 
                  the rapid population growth rate of <span className="text-cyan-300 font-semibold">1.5 million people annually</span>, the high urbanization 
                  rate exceeding <span className="text-cyan-300 font-semibold">43%</span>, and the concentration of more than 
                  <span className="text-cyan-300 font-semibold"> 22 million residents</span> in Greater Cairo alone, all contributing to extensive pressure on 
                  road networks.
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Extended congestion has been shown to increase fuel consumption by <span className="text-cyan-300 font-semibold">20-40%</span>, elevate CO₂ and NOₓ emissions by 
                  up to <span className="text-cyan-300 font-semibold">30%</span>, raise accident rates, and reduce overall road efficiency. A major contributor to these issues is the absence of 
                  adaptive traffic-management systems capable of responding to real-time changes in vehicle flow, resulting in increased delays, reduced safety, and 
                  limited emergency-vehicle mobility, particularly in densely populated areas such as Cairo, Giza, and Alexandria.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* System Features Grid */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.h2
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-4"
            >
              System Architecture
            </motion.h2>
            <p className="text-xl text-blue-200/80">Four integrated stages working in harmony</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {systemFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative backdrop-blur-2xl bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border-2 border-blue-500/20 rounded-3xl overflow-hidden hover:border-cyan-400/40 transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-20`} />
                <div className="relative h-48 w-full overflow-hidden">
                  <div className="absolute inset-0">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      unoptimized
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/50 to-transparent z-10" />
                </div>
                <div className="relative z-10 p-8">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-cyan-300 mb-4">{feature.title}</h3>
                  <p className="text-blue-200/80 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-2xl bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-2 border-cyan-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full">
              <motion.div
                animate={{ 
                  x: [0, 100, 0],
                  y: [0, 50, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
              />
            </div>
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/30 to-blue-500/30 backdrop-blur-xl border border-cyan-400/40 rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-cyan-300" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Our Solution
                </h2>
              </motion.div>
              
              <div className="space-y-6 text-blue-100/90 text-lg leading-relaxed">
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  This prototype tends to solve these limitations by integrating a fully automated intelligent-road system 
                  supported by machine learning, IoT communication, and real-time decision making. The system requires low 
                  operational cost, produces no harmful byproducts, and is equipped with continuous monitoring and adaptive 
                  control.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  This prototype is characterized by an integrated IoT-based feedback design. Instead of fixed timer 
                  intersections, real-time road conditions govern each decision. At the end of each sensing cycle, data such as 
                  vehicle speed, congestion density, and pollution level are collected and analyzed. Based on these readings, an 
                  automated feedback loop determines whether to extend lights, shorten them, activate the emergency green 
                  corridor, or maintain the current flow.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="backdrop-blur-2xl bg-gradient-to-br from-indigo-950/50 via-blue-950/50 to-cyan-950/50 border-2 border-indigo-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-8 text-center"
              >
                Results & Performance
              </motion.h2>
              
              <div className="space-y-6 text-blue-100/90 text-lg leading-relaxed mb-12">
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  Through comprehensive testing and comparison with prior solutions, the intelligent traffic system designed in 
                  this study confirmed significant and measurable improvements in urban traffic quality and safety. While 
                  existing prior solutions such as the <span className="text-cyan-300 font-semibold">Cairo ITS</span> and the <span className="text-cyan-300 font-semibold">New Administrative Capital ITS</span> offer valuable 
                  monitoring capabilities and centralized control, research highlighted determined limitations in their high 
                  operational cost, restricted scalability, fixed-timing dependency, and lack of predictive accident detection or 
                  V2V communication.
                </motion.p>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Addressing these gaps, the system performed well in all the design criteria. The change 
                  in Velocity-time and Position-time graphs in trip time of <span className="text-cyan-300 font-semibold">58.3%</span>, reduction in the wait time of <span className="text-cyan-300 font-semibold">85.9%</span> at the 
                  intersection points, and enhancement in traffic flow of <span className="text-cyan-300 font-semibold">~300%</span> supported by the accuracy of the system of 
                  <span className="text-cyan-300 font-semibold"> ~90%</span> in accurately measuring car density from the camera at <span className="text-cyan-300 font-semibold">89.2%</span> accuracy. The graphical trend of the 
                  performance of the velocity-time and distance-time clearly identified the adaptation of the traffic in reducing 
                  the number of stops in the traffic.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Additionally, the accuracy of the prediction of accidents of <span className="text-cyan-300 font-semibold">80%</span> was 
                  obtained from the machine learning decisions. In addition, the system demonstrated effective treatment of 
                  speed-limit violations with detection accuracy of <span className="text-cyan-300 font-semibold">~97%</span>. The processing time response averaged 
                  approximately <span className="text-cyan-300 font-semibold">1.46 seconds</span>. Simulated evaluations further indicated decreases in fuel emission and pollution 
                  by <span className="text-cyan-300 font-semibold">51.6%</span>, supporting environmental objectives.
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  Compared with prior solutions that require large setup, this 
                  automated design proved scalable and low-cost due to IoT communication and integrated components. 
                  Ultimately, the results confirm that an ICT-integrated, data-driven, and adaptively controlled road system can 
                  clearly enhance safety, trip time, vehicle movement continuity, emergency priority, and environmental 
                  outcomes, positioning the model as a practical and forward-looking contribution to addressing Egypt's 
                  traffic-congestion challenges and advancing transportation sustainability.
                </motion.p>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                {results.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="backdrop-blur-xl bg-blue-950/30 border border-cyan-500/20 rounded-2xl p-4 text-center hover:border-cyan-400/40 transition-all duration-300"
                  >
                    <div className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-1">
                      {result.value}
                    </div>
                    <div className="text-sm font-semibold text-cyan-300 mb-1">{result.metric}</div>
                    <div className="text-xs text-blue-200/70">{result.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Prototype Images Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent mb-4">
              System Prototype
            </h2>
            <p className="text-xl text-blue-200/80">Visual showcase of the ITO+ intelligent traffic system</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Traffic in Greater Cairo', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop' },
              { title: 'Cairo Traffic Intersection', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' },
              { title: 'Urban Traffic Flow', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop' },
              { title: 'Traffic Congestion', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' },
              { title: 'City Road Network', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop' },
              { title: 'Traffic Management', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop' },
            ].map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative backdrop-blur-2xl bg-blue-950/40 border-2 border-blue-500/20 rounded-2xl overflow-hidden hover:border-cyan-400/40 transition-all duration-300"
              >
                <div className="relative h-64 w-full">
                  <Image
                    src={image.url}
                    alt={image.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-semibold text-white">{image.title}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 backdrop-blur-2xl bg-blue-950/40 border-t border-cyan-500/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  ITO<sub className="text-sm text-cyan-400">+</sub>
                </h3>
                <p className="text-xs text-blue-300/70">Intelligent Traffic Observer</p>
              </div>
            </div>
            <p className="text-blue-200/80 text-sm text-center md:text-right">
              &copy; 2025 ITO+ Capstone Project. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
