'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const GallerySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  // Sample gallery images - replace with your actual images
  const galleryImages = [
    {
      id: 1,
      src: '/images/gallery/fablab.jpg',
      alt: 'Fablab workspace',
      title: 'Fablab'
    },
    {
      id: 2,
      src: '/images/gallery/machines.jpg',
      alt: 'Epilog Laser Mini workspace',
      title: 'Laser Cutting Station'
    },
    {
      id: 3,
      src: '/images/gallery/machines2.jpg',
      alt: "Ultimaker 2 Extended Plus and SRM-20 CNC",
      title: "3D Printing and CNC Station"
    },
    {
      id: 4,
      src: '/images/gallery/manual.jpg',
      alt: "Workbench for manual fabrication",
      title: "Woodworking and Assembly Table"
    },
    {
      id: 5,
      src: '/images/gallery/closing.jpg',
      alt: "Covered machines in fablab",
      title: "Fablab Closing Time"
    }
  ]

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === galleryImages.length - 1 ? 0 : prevIndex + 1
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [galleryImages.length])

  const nextSlide = () => {
    setCurrentIndex(currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1)
  }

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1)
  }

  const openModal = (imageSrc: string) => {
    setSelectedImage(imageSrc)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage('')
  }

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-white to-fablab-light dark:from-gray-900 dark:to-gray-800">
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
            Our <span className="bg-gradient-to-r from-fablab-primary to-fablab-accent bg-clip-text text-transparent">Gallery</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Take a visual journey through our FabLab and see the amazing projects and innovations created by our students
          </p>
        </motion.div>

        {/* Gallery Slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img
                  src={galleryImages[currentIndex].src}
                  alt={galleryImages[currentIndex].alt}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openModal(galleryImages[currentIndex].src)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{galleryImages[currentIndex].title}</h3>
                  <p className="text-lg opacity-90">{galleryImages[currentIndex].alt}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden md:flex space-x-2">
              {galleryImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mt-8">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative h-20 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                  index === currentIndex ? 'border-fablab-primary' : 'border-transparent hover:border-fablab-primary/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-fablab-primary/20" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Gallery image"
                className="w-full h-full object-contain rounded-lg"
              />
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default GallerySlider
