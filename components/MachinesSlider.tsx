'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Printer, Zap, Cpu, Wrench, Settings, Monitor, ChevronRight, Info } from 'lucide-react'

const MachinesSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedMachine, setSelectedMachine] = useState<number | null>(null)

  const machines = [
    {
      id: 1,
      name: '3D Printer',
      icon: Printer,
      image: '/images/machines/3d-printer.jpg',
      videoUrl: 'https://www.youtube.com/embed/wMdSzNOALeQ',
      description: 'Create three-dimensional objects from digital designs using various materials.',
      features: ['High precision printing', 'Multiple material support', 'User-friendly interface', 'Large build volume'],
      specifications: {
        'Build Volume': '223 × 223 × 305 mm',
        'Layer Resolution': '~600 µm down to 20 µm (20–600 µm)',
        'Materials': 'PLA, ABS, CPE, PC, Nylon, TPU 95A (open‐filament system)',
        'Nozzle Temperature': '180 °C – 260 °C'
      }
    },
    {
      id: 2,
      name: 'CNC Laser',
      icon: Zap,
      image: '/images/machines/cnc.jpg',
      videoUrl: 'https://www.youtube.com/embed/lHZkBFafMuA',
      description: "Precision cutting and engraving on wood, acrylic, leather and other materials with CO₂ laser technology.",
      features: [
        "High precision cutting and engraving (raster, vector or combined)",
        "Supports multiple materials (wood, acrylic, leather, paper, etc)",
        "Vector and raster modes with color-mapping of speed/power",
        "Safety and accuracy features (air-assist, red-dot pointer, heavy duty bearings)",
      ],
      specifications: {
        "Laser Power": "30 W or 40 W (Mini 18) / up to 60 W (Mini 24)",
        "Work Area": "18″ × 12″ (457 × 305 mm) or 24″ × 12″ (610 × 305 mm)",
        "Materials": "Wood, Acrylic, Leather, Paper (and many others suitable for CO₂ laser engraving/cutting)",
        "Maximum Material Thickness": "up to ~4″ (101 mm) for Mini 18; up to ~5.5″ (140 mm) for Mini 24 (more when table removed)"
      }      
    },
    {
      id: 3,
      name: 'CNC Milling Machine',
      icon: Settings,
      image: '/images/machines/cnc-milling.jpg',
      videoUrl: 'https://www.youtube.com/embed/F8nZBGfCSQc',
      description: "Compact desktop milling machine for precise 3D modeling, PCB prototyping, and small part fabrication on materials like wax, wood, acrylic, and ABS using advanced CNC technology.",
      features: [
        "High precision 3-axis milling with 0.01 mm resolution",
        "Supports a wide range of materials including modeling wax, chemical wood, acrylic, ABS, and PCB",
        "Fully enclosed cabinet with safety interlock for clean and safe operation",
        "User-friendly VPanel software for spindle control and tool management"
      ],
      specifications: {
        "Work Area (X × Y × Z)": "203.2 × 152.4 × 60.5 mm",
        "Table Size": "232.2 × 156.6 mm",
        "Spindle Motor": "DC motor Type 380",
        "Spindle Speed": "3,000 – 7,000 rpm (adjustable)",
        "Feed Rate": "6 – 1800 mm/min",
        "Resolution": "0.01 mm/step (RML-1) or 0.001 mm/step (NC code)",
        "Mechanical Resolution": "0.000998 mm/step",
        "Materials": "Modeling wax, chemical wood, foam, acrylic, ABS, PC board",
        "Max Workpiece Weight": "2 kg",
        "Interface": "USB",
        "Power Supply": "DC 24V, 2.5A (via AC 100-240V adapter)",
        "Power Consumption": "Approx. 50W",
        "Machine Dimensions": "451 × 426.6 × 426.2 mm",
        "Weight": "19.6 kg",
        "Noise Level": "≤ 65 dB(A) during operation",
        "Operating Environment": "5–40°C, 35–80% RH (non-condensing)"
      }
    },
    {
      id: 4,
      name: 'Vinyl Cutter',
      icon: Cpu,
      image: '/images/machines/vinyl-cutter.jpg',
      videoUrl: 'https://www.youtube.com/embed/-jPHbfBohe4',
      description: "Precision desktop cutter for professional-grade production of vinyl graphics, decals, signs, heat transfers, and specialty apparel. It features a completely redesigned cutting carriage for increased stability and a high downforce, enabling it to cut a wide variety of materials with speed and accuracy.",
      features: [
        "High cutting force of up to 350 gf for thick media like magnetic materials",
        "Fast cutting speed up to 500 mm/s (19.69 in/s)",
        "Optical registration system for contour cutting of pre-printed graphics (print-then-cut)",
        "Supports media widths from 50 mm to 700 mm (2 in to 27.5 in)",
        "Overlap cutting (up to 10x) and perforated cutting functionality",
        "Digital control servo motor for reliable and accurate long-run cutting",
        "Includes Roland CutStudio software and plug-ins for Adobe Illustrator/CorelDRAW"
      ],
      specifications: {
        "Cutting Method": "Media-moving method",
        "Driving Method": "Digital control servo motor",
        "Max. Cutting Area (W × L)": "584 mm × 25,000 mm",
        "Acceptable Media Width": "50 – 700 mm (2 – 27.5 in)",
        "Max. Cutting Speed": "500 mm/s (all directions)",
        "Blade Force (Downforce)": "30 – 350 gf",
        "Mechanical Resolution": "0.0125 mm/step",
        "Materials": "Vinyl, paint mask, heat transfer material, sandblast material, twill, magnetic materials, card stock",
        "Interface": "USB 2.0",
        "Replot Memory": "2 MB",
        "Power Consumption": "Approx. 30 W",
        "Machine Dimensions (W × D × H)": "860 × 319 × 235 mm",
        "Weight": "13.5 kg",
        "Noise Level (Operating)": "≤ 70 dB(A)",
        "Operating Environment": "5–40°C, 35–80% RH (non-condensing)"
      }
    },
    {
      id: 5,
      name: 'CNC Router',
      icon: Monitor,
      image: '/images/machines/cnc-router.jpg',
      videoUrl: 'https://www.youtube.com/embed/pEI2sTMuM08',
      description: "Industrial-grade CNC machine designed for high-volume production, including cutting, carving, and engraving large materials like full wood sheets, MDF, acrylic, and PVC. It features a robust structure and a large working area for furniture and sign-making applications.",
      features: [
        "Large working area of 1500 x 3000 mm for full-sheet processing",
        "High-power spindle (typically 3.5 kW or higher) with high-speed rotation",
        "Sturdy heavy-duty welded tube steel frame for stability and precision",
        "Precision motion system with Taiwanese linear guides and ball screw (Z-axis)",
        "Compatibility with popular CAD/CAM software (e.g., Artcam, Aspire, Mastercam)",
        "T-Slot table (often with optional vacuum functionality) for strong material holding"
      ],
      specifications: {
        "Work Area (X × Y × Z)": "1500 × 3000 × 200 mm (Approx.)",
        "Table Size": "1560 × 3100 mm (Approx.)",
        "Spindle Power": "3.5 kW (Standard, upgradable to 4.5 kW or more)",
        "Spindle Speed": "0 – 18000 RPM",
        "Drive System": "Stepper Motor (Standard, upgradable to Servo Motor)",
        "Max. Traveling Speed": "25,000 mm/min (Approx.)",
        "Max. Working Speed": "15,000 mm/min (Approx.)",
        "Transmission": "X/Y: Helical Rack & Pinion/Linear Guide; Z: Ball Screw",
        "Control System": "NC Studio or DSP Remote Controller",
        "Voltage": "AC 380V / 3 Phase / 50Hz (Industrial)",
        "Net Weight": "Approx. 1250 – 1500 kg",
        "Materials": "Wood, MDF, Plywood, Acrylic, PVC, Foam, Aluminum (soft metals)"
      }
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === machines.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [machines.length])

  const nextSlide = () => {
    setCurrentIndex(currentIndex === machines.length - 1 ? 0 : currentIndex + 1)
  }

  const prevSlide = () => {
    setCurrentIndex(currentIndex === 0 ? machines.length - 1 : currentIndex - 1)
  }

  const openMachineDetails = (machineId: number) => {
    setSelectedMachine(machineId)
  }

  const closeMachineDetails = () => {
    setSelectedMachine(null)
  }

  return (
    <section id="machines" className="py-20 bg-gradient-to-b from-fablab-light to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-fablab-dark dark:text-white mb-4">
            Our <span className="bg-gradient-to-r from-fablab-primary to-fablab-accent bg-clip-text text-transparent">Machines</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Explore our state-of-the-art equipment and tools that bring your creative ideas to life
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative h-[580px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-gray-800">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col md:flex-row"
              >
                <div className="w-full md:w-1/2 relative h-1/2 md:h-auto">
                  <img
                    src={machines[currentIndex].image}
                    alt={machines[currentIndex].name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-transparent to-white/80 dark:to-gray-900/80" />
                </div>

                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col h-1/2 md:h-auto overflow-y-auto md:overflow-visible">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-fablab-primary to-fablab-accent rounded-xl flex items-center justify-center mr-4">
                      {(() => {
                        const IconComponent = machines[currentIndex].icon
                        return <IconComponent className="w-8 h-8 text-white" />
                      })()}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-fablab-dark dark:text-white">
                      {machines[currentIndex].name}
                    </h3>
                  </div>

                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                    {machines[currentIndex].description}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-fablab-dark dark:text-white mb-3">Key Features:</h4>
                    <ul className="space-y-2">
                      {machines[currentIndex].features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                          <ChevronRight className="w-4 h-4 text-fablab-primary mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 md:mt-6 sticky bottom-0 pt-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openMachineDetails(machines[currentIndex].id)}
                    className="bg-gradient-to-r from-fablab-primary to-fablab-accent text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 w-fit"
                  >
                    <Info className="w-5 h-5" />
                    <span>Learn More</span>
                  </motion.button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>  

            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 dark:bg-gray-700/40 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/60 text-fablab-dark dark:text-white p-3 rounded-full transition-all duration-300 shadow-lg"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 dark:bg-gray-700/40 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-gray-700/60 text-fablab-dark dark:text-white p-3 rounded-full transition-all duration-300 shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 hidden md:flex space-x-2">
              {machines.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-fablab-primary' : 'bg-white/50 dark:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {machines.map((machine, index) => (
              <motion.div
                key={machine.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative h-20 md:h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                  index === currentIndex ? 'border-fablab-primary' : 'border-transparent hover:border-fablab-primary/50'
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <img
                  src={machine.image}
                  alt={machine.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {(() => {
                    const IconComponent = machine.icon
                    return <IconComponent className="w-6 h-6 text-white" />
                  })()}
                </div>
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-fablab-primary/20" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedMachine && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeMachineDetails}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const machine = machines.find(m => m.id === selectedMachine)
                if (!machine) return null

                return (
                  <div className="flex flex-col md:flex-row max-h-[90vh]">
                    <div className="md:w-1/2">
                      <div className="relative w-full h-64 md:h-full">
                        <iframe
                          src={machine.videoUrl}
                          title={`${machine.name} Video`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                    <div className="md:w-1/2 p-8 overflow-y-auto">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-fablab-primary to-fablab-accent rounded-lg flex items-center justify-center mr-4">
                          {(() => {
                            const IconComponent = machine.icon
                            return <IconComponent className="w-6 h-6 text-white" />
                          })()}
                        </div>
                        <h3 className="text-2xl font-bold text-fablab-dark dark:text-white">{machine.name}</h3>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-6">{machine.description}</p>

                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-fablab-dark dark:text-white mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {machine.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                              <ChevronRight className="w-4 h-4 text-fablab-primary mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-fablab-dark dark:text-white mb-3">Specifications:</h4>
                        <div className="space-y-2">
                          {Object.entries(machine.specifications).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                              <span className="font-medium text-fablab-dark dark:text-white">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={closeMachineDetails}
                        className="bg-gradient-to-r from-fablab-primary to-fablab-accent text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

export default MachinesSlider