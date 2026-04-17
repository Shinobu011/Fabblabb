'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  Award, 
  Star, 
  Facebook, 
  Mail,
  User,
  GraduationCap,
  Trophy,
  UserCheck,
  BookOpen,
  Rocket,
  Medal
} from 'lucide-react'

const TeamSection = () => {
  const teamLeaders = {
    boys: [
      {
        id: 1,
        name: 'Amr Elkhooly',
        role: 'Leader',
        image: '/images/team/amr.jpg',
        bio: 'Expert in IoT and machines.',
        skills: ['3D Printing', 'CNC', 'IoT', 'Robotics', 'Machines', 'Front-end'],
        projects: ['Khedr', 'Artificial Nerve', 'ChemoCell', 'Sara'],
        email: 'amrelkhooly08@gmail.com',
        facebook: 'https://web.facebook.com/amrelkhooly.elkhooly/'
      },
      {
        id: 2,
        name: 'Yousef Gaber',
        role: 'Leader',
        image: '/images/team/yousef.jpg',
        bio: 'Full-stack web developer and IoT expert',
        skills: ['Arduino', 'Esp-32', 'Web Dev', 'IoT', 'Robotics', 'Full-stack Dev'],
        projects: ['Khedr', 'Chemo Cell', 'Agro-Tech', 'Boxie'],
        email: 'yousefgaber2792008@gmail.com',
        facebook: 'https://www.facebook.com/share/18e6Mfg8oz/'
      },
      {
        id: 3,
        name: 'Yassen Ahmed',
        role: 'Leader',
        image: '/images/team/yassen.jpg',
        bio: 'Expert in robotics and machines.',
        skills: ['Arduino', 'Robotics', 'CNC', '3D Printing', 'Machines', 'Front-end'],
        projects: ['Khedr', 'Chemo Cell', 'Fencing Sword', 'Aorsy'],
        email: 'yaso5mimo@gmail.com',
        facebook: 'https://www.facebook.com/YaseeenAhmed?locale=ar_AR'
      },
      {
        id: 4,
        name: 'Omar Fathy',
        role: 'Leader',
        image: '/images/team/omar.jpg',
        bio: 'Expert in IOT and Machines.',
        skills: ['Arduino', 'Robotics', 'CNC', '3D Printing', 'Soldering', 'Esp-32 Cam'],
        projects: ['Chronic Disease Guardian ','Electric Shoe','Smart Water Filter','Intelligent prosthetic limb'],
        email: 'omar.2323031@stemqena.moe.edu.eg',
        facebook: 'https://www.facebook.com/profile.php?id=100089049647921'
      },
      {
        id: 5,
        name: 'Sondos Ahmed',
        role: 'Leader',
        image: '/images/team/Sondos.jpg',
        bio: 'Expert in machines and Arduino.',
        skills: ['CNC', '3D Printing', 'Machines', 'Arduino'],
        projects: ['Vision aid', 'Nano-healing', 'Chemo Cell'],
        email: 'Sondos.2323538@stemqena.moe.edu.eg',
        facebook: 'https://www.facebook.com/sondos.ahmed.375680?locale=ar_AR'
      },
      {
        id: 6,
        name: 'Amr Abdelshafy',
        role: 'FabLab Manager',
        image: '/images/team/amr-manager.jpg',
        bio: 'Expert in Machines and Soldering.',
        skills: ['CNC', '3D Printing', 'PCBs', 'IoT', 'Machines'],
        projects: ['G10 Projects', 'G11 Projects', 'G12 Projects', 'Competition projects'],
        email: 'amr.abdelshafy@stemqena.moe.edu.eg',
        facebook: 'https://www.facebook.com/amr.elbuomy'
      }
    ]
  }

  const TeamCard = ({ member }: { member: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.8,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        y: -15,
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 overflow-hidden relative"
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
      
      <div className="relative z-10 text-center">
        {/* Profile Image with enhanced animation */}
        <motion.div 
          className="relative mb-6"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative inline-block">
            <motion.img
              src={member.image}
              alt={member.name}
              className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-white dark:border-gray-900 shadow-xl"
              whileHover={{ rotate: 5 }}
              transition={{ duration: 0.3 }}
            />
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ mask: "radial-gradient(circle, transparent 60%, black 60%)" }}
            />
            {/* Award badge with pulse animation */}
            <motion.div 
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Award className="w-5 h-5 text-white" />
            </motion.div>
          </div>
        </motion.div>
        
        {/* Name and Role with staggered animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {member.name}
          </h3>
          <p className="text-blue-600 font-semibold mb-4 text-sm uppercase tracking-wide">
            {member.role}
          </p>
        </motion.div>

        {/* Bio with fade-in animation */}
        <motion.p 
          className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
        >
          {member.bio}
        </motion.p>
        
        {/* Skills with staggered animation */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Skills</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {member.skills.map((skill: string, index: number) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.1, y: -2 }}
                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium hover:from-blue-200 hover:to-purple-200 dark:hover:from-blue-800/50 dark:hover:to-purple-800/50 transition-all duration-300 cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </motion.div>
        
        {/* Projects with slide-up animation */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Projects</h4>
          <div className="grid grid-cols-2 gap-2">
            {member.projects.slice(0, 4).map((project: string, index: number) => (
              <motion.div 
                key={index} 
                className="flex items-center justify-center text-xs text-gray-600 dark:text-gray-400"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <Rocket className="w-3 h-3 text-blue-500 mr-1 flex-shrink-0" />
                <span className="truncate">{project}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Social links with enhanced animations */}
        <motion.div 
          className="flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          viewport={{ once: true }}
        >
          <motion.a
            href={`mailto:${member.email}`}
            whileHover={{ 
              scale: 1.2, 
              rotate: 5,
              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Mail className="w-4 h-4" />
          </motion.a>
          <motion.a
            href={member.facebook}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ 
              scale: 1.2, 
              rotate: -5,
              boxShadow: "0 10px 25px rgba(24, 119, 242, 0.3)"
            }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Facebook className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  )

  return (
    <section id="team" className="py-20 bg-gradient-to-b from-white to-fablab-light dark:from-gray-900 dark:to-gray-800">
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
            Our <span className="bg-gradient-to-r from-fablab-primary to-fablab-accent bg-clip-text text-transparent">Team</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Meet our dedicated team leaders who guide and inspire students in their creative journey
          </p>
        </motion.div>

        {/* Team Leaders Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.div 
            className="flex items-center justify-center mb-12"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-4 shadow-lg border border-blue-200/50 dark:border-gray-700/50">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <User className="w-7 h-7 text-white" />
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Team Leaders</h3>
            </div>
          </motion.div>
          
          <div className="space-y-8">
            {/* First row - 3 cards */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {teamLeaders.boys.slice(0, 3).map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.5 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                >
                  <TeamCard member={member} />
                </motion.div>
              ))}
            </motion.div>

            {/* Second row - 3 cards */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
            >
              {teamLeaders.boys.slice(3).map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  viewport={{ once: true }}
                >
                  <TeamCard member={member} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Team Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, type: "spring", stiffness: 100 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
            
            <div className="relative z-10">
              <motion.h3 
                className="text-2xl md:text-3xl font-bold text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                viewport={{ once: true }}
              >
                Our Impact in Numbers
              </motion.h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
                {[
                  { 
                    number: "5", 
                    label: "Team Leaders", 
                    icon: Users,
                    color: "from-blue-400 to-blue-600"
                  },
                  { 
                    number: "2000+", 
                    label: "Students Mentored", 
                    icon: UserCheck,
                    color: "from-green-400 to-green-600"
                  },
                  { 
                    number: "100+", 
                    label: "Projects Completed", 
                    icon: Rocket,
                    color: "from-purple-400 to-purple-600"
                  },
                  { 
                    number: "30+", 
                    label: "Awards Won", 
                    icon: Medal,
                    color: "from-orange-400 to-orange-600"
                  }
                ].map((stat, index) => {
                  const IconComponent = stat.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.6,
                        delay: 1.2 + index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 hover:bg-white/20 transition-all duration-300 group"
                    >
                      <motion.div 
                        className="flex justify-center mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                          <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                      </motion.div>
                      <motion.div 
                        className="text-2xl md:text-3xl font-bold mb-2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ 
                          duration: 0.5, 
                          delay: 1.3 + index * 0.1,
                          type: "spring",
                          stiffness: 200
                        }}
                        viewport={{ once: true }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-sm md:text-base text-blue-100 font-medium">
                        {stat.label}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default TeamSection
