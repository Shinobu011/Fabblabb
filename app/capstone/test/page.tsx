'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

// ... existing imports ...

// ... inside component ...


import Link from 'next/link'
import Image from 'next/image'
import { Camera, PlayCircle, ArrowLeft, Car, Radio, Upload } from 'lucide-react'
import Script from 'next/script'

declare global {
  interface Window {
    Chart: any
  }
}

export default function TestSystemPage() {
  console.log('TestSystemPage component rendered')
  const [view, setView] = useState<'main' | 'detection'>('main')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const [selectedVideoName, setSelectedVideoName] = useState<string | null>(null)
  const [selectedJsonName, setSelectedJsonName] = useState<string | null>(null)
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [selectedJsonFile, setSelectedJsonFile] = useState<File | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<Record<string, any>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const posChartRef = useRef<any>(null)
  const velChartRef = useRef<any>(null)
  const distChartRef = useRef<any>(null)
  const [redCarDetected, setRedCarDetected] = useState(false)
  const [emergencyDetected, setEmergencyDetected] = useState(false)
  const lastBarrierCmdRef = useRef<string>('')

  const [serialStatus, setSerialStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const serialWriterRef = useRef<WritableStreamDefaultWriter | null>(null)

  // Web Serial Connection
  const connectSerial = async (): Promise<boolean> => {
    if (!('serial' in navigator)) {
      MySwal.fire('Error', 'Web Serial API not supported in this browser.', 'error')
      setSerialStatus('error')
      return false
    }
    setSerialStatus('connecting')
    try {
      // Prompt user for port (Camera-style browser prompt)
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 9600 })
      const writer = port.writable.getWriter()
      serialWriterRef.current = writer
      setSerialStatus('connected')
      console.log('Serial Port Connected Successfully')
      return true
    } catch (e) {
      console.error('Serial connection failed:', e)
      setSerialStatus('error')
      return false
    }
  }

  // Color mapping for cars
  const getCarColor = (carLabel: string) => {
    const colors: Record<string, string> = {
      'RED CAR': 'rgb(255, 0, 0)',
      'ORANGE CAR': 'rgb(255, 140, 0)',
      'YELLOW CAR': 'rgb(255, 255, 0)',
      'GREEN CAR': 'rgb(0, 255, 0)',
      'BLUE CAR': 'rgb(0, 0, 255)',
    }
    return colors[carLabel] || `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
  }

  const stopStream = () => {
    streamAbortRef.current?.abort()
    streamAbortRef.current = null
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setIsProcessing(false)
    setTrackingData({})
    setSessionId(null)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'o') {
        MySwal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          background: '#ef4444',
          color: '#fff'
        }).fire({
          icon: 'warning',
          title: 'Accident Detected!',
          text: 'Emergency services alerted.'
        })
      } else if (e.key.toLowerCase() === 'r') {
        if (serialWriterRef.current) {
          const cmd = "RED_SEQUENCE\n"
          const encoder = new TextEncoder()
          serialWriterRef.current.write(encoder.encode(cmd))
            .then(() => {
              console.log('Successfully sent RED_SEQUENCE to Arduino')
              showToast('Red Sequence Triggered', 'info')
            })
            .catch((err: any) => console.error("Serial write error:", err))
        } else {
          MySwal.fire('Not Connected', 'Please connect to Arduino first.', 'warning')
        }
      } else if (e.key.toLowerCase() === 't') {
        if (serialWriterRef.current) {
          const cmd = "TRAFFIC_SEQ_T\n"
          const encoder = new TextEncoder()
          serialWriterRef.current.write(encoder.encode(cmd))
            .then(() => {
              console.log('Successfully sent TRAFFIC_SEQ_T to Arduino')
              showToast('Sequence T Triggered', 'info')
            })
            .catch((err: any) => console.error("Serial write error:", err))
        } else {
          MySwal.fire('Not Connected', 'Please connect to Arduino first.', 'warning')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      stopStream()
    }
  }, [])

  // Update unified charts when tracking data changes
  useEffect(() => {
    if (!window.Chart || Object.keys(trackingData).length === 0) return

    const posCanvas = document.getElementById('pos-chart-unified') as HTMLCanvasElement
    const velCanvas = document.getElementById('vel-chart-unified') as HTMLCanvasElement
    const distCanvas = document.getElementById('dist-chart-unified') as HTMLCanvasElement

    if (!posCanvas || !velCanvas || !distCanvas) return

    // Create unified position chart
    if (!posChartRef.current) {
      posChartRef.current = new window.Chart(posCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          },
          plugins: {
            legend: {
              labels: { color: 'rgba(255, 255, 255, 0.9)' }
            }
          }
        }
      })
    }

    // Create unified velocity chart
    if (!velChartRef.current) {
      velChartRef.current = new window.Chart(velCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          },
          plugins: {
            legend: {
              labels: { color: 'rgba(255, 255, 255, 0.9)' }
            }
          }
        }
      })
    }

    // Create unified distance chart
    // Create unified distance chart
    if (!distChartRef.current) {
      distChartRef.current = new window.Chart(distCanvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: [],
          datasets: []
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
              ticks: { color: 'rgba(255, 255, 255, 0.7)' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          },
          plugins: {
            legend: {
              labels: { color: 'rgba(255, 255, 255, 0.9)' }
            }
          }
        }
      })
    }

    // Update charts with all cars data
    if (posChartRef.current && velChartRef.current && distChartRef.current) {
      // Get all unique times across all cars
      const allTimes = new Set<number>()
      Object.values(trackingData).forEach((data: any) => {
        if (data.times) {
          data.times.forEach((t: number) => allTimes.add(t))
        }
      })
      const sortedTimes = Array.from(allTimes).sort((a, b) => a - b)

      // Update position chart
      posChartRef.current.data.labels = sortedTimes
      posChartRef.current.data.datasets = []
      Object.entries(trackingData).forEach(([carLabel, data]: [string, any]) => {
        if (data.times && data.times.length > 0) {
          // X Position
          const xData = sortedTimes.map(t => {
            const idx = data.times.indexOf(t)
            return idx >= 0 ? data.xPositions[idx] : null
          })
          posChartRef.current.data.datasets.push({
            label: `${carLabel} - X`,
            data: xData,
            borderColor: getCarColor(carLabel),
            backgroundColor: getCarColor(carLabel).replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.4,
            pointRadius: 0
          })
          // Y Position
          const yData = sortedTimes.map(t => {
            const idx = data.times.indexOf(t)
            return idx >= 0 ? data.yPositions[idx] : null
          })
          posChartRef.current.data.datasets.push({
            label: `${carLabel} - Y`,
            data: yData,
            borderColor: getCarColor(carLabel),
            backgroundColor: getCarColor(carLabel).replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.4,
            borderDash: [5, 5],
            pointRadius: 0
          })
        }
      })
      posChartRef.current.update('none')

      // Update velocity chart
      const allVelTimes = new Set<number>()
      Object.values(trackingData).forEach((data: any) => {
        if (data.velTimes) {
          data.velTimes.forEach((t: number) => allVelTimes.add(t))
        }
      })
      const sortedVelTimes = Array.from(allVelTimes).sort((a, b) => a - b)

      velChartRef.current.data.labels = sortedVelTimes
      velChartRef.current.data.datasets = []
      Object.entries(trackingData).forEach(([carLabel, data]: [string, any]) => {
        if (data.velTimes && data.velTimes.length > 0) {
          const velData = sortedVelTimes.map(t => {
            const idx = data.velTimes.indexOf(t)
            return idx >= 0 ? data.velValues[idx] : null
          })
          velChartRef.current.data.datasets.push({
            label: `${carLabel} - Velocity`,
            data: velData,
            borderColor: getCarColor(carLabel),
            backgroundColor: getCarColor(carLabel).replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.4,
            pointRadius: 0
          })
        }
      })
      velChartRef.current.update('none')

      // Update distance chart
      distChartRef.current.data.labels = sortedTimes
      distChartRef.current.data.datasets = []
      Object.entries(trackingData).forEach(([carLabel, data]: [string, any]) => {
        if (data.times && data.times.length > 0) {
          const distData = sortedTimes.map(t => {
            const idx = data.times.indexOf(t)
            return idx >= 0 ? data.distances[idx] : null
          })
          distChartRef.current.data.datasets.push({
            label: `${carLabel} - Distance`,
            data: distData,
            borderColor: getCarColor(carLabel),
            backgroundColor: getCarColor(carLabel).replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.4,
            pointRadius: 0
          })
        }
      })
      distChartRef.current.update('none')
    }
  }, [trackingData])

  const [realCars, setRealCars] = useState<any[]>([])
  // We don't need isLiveConfigOpen anymore as Swal handles it
  const [isWaitingForLiveJson, setIsWaitingForLiveJson] = useState(false)
  const [liveConfig, setLiveConfig] = useState<{ webcamIp: string; carIps: Record<string, string> }>({
    webcamIp: '',
    carIps: {}
  })

  const lastSerialCmdRef = useRef<string>('')

  // Helper for tiny toast alerts
  const showToast = (msg: string, icon: 'success' | 'info' = 'success') => {
    MySwal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: '#1e293b',
      color: '#fff'
    }).fire({
      icon: icon,
      title: msg
    })
  }

  // Shared function to handle response stream (MJPEG + SSE)
  const handleStreamResponse = async (res: Response, videoName?: string, jsonName?: string, speedVal?: number) => {
    console.log('Response received, processing stream...')


    // Get session ID from response header
    const sid = res.headers.get('X-Session-Id')
    if (sid) {
      setSessionId(sid)
      // Start listening to tracking data via SSE
      const eventSource = new EventSource(`/api/capstone/detection-data?sessionId=${sid}`)
      eventSourceRef.current = eventSource

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as any


          // Traffic Traffic Light Logic (Web Serial)
          if (data.type === 'tracking_data' && data.traffic_decision) {
            const currentDecision = data.traffic_decision;

            // Log every decision for debugging
            console.log(`[AI Decision] ${currentDecision}`);

            if (!lastSerialCmdRef.current) {
              showToast('Traffic Control Link Active', 'info');
              lastSerialCmdRef.current = 'INITIALIZING'; // Use a dummy value to trigger the first real state
            }

            if (currentDecision !== lastSerialCmdRef.current) {
              console.log('Traffic Decision Changed:', currentDecision)

              if (serialWriterRef.current) {
                const cmd = currentDecision + "\n"
                const encoder = new TextEncoder()
                serialWriterRef.current.write(encoder.encode(cmd))
                  .then(() => {
                    console.log('Successfully sent to Arduino:', cmd.trim())
                    showToast(`Signal: ${currentDecision}`, 'success')
                  })
                  .catch((err: any) => {
                    console.error("Serial write error:", err)
                    showToast('Serial Write Failed', 'error' as any)
                  })
              } else {
                console.warn('Traffic decision received but Serial writer is not connected.')
                if (lastSerialCmdRef.current === 'INITIALIZING') showToast('Arduino Disconnected', 'info')
              }

              lastSerialCmdRef.current = currentDecision
            }
          }

          // Barrier Logic (Emergency / Orange Car)
          if (data.type === 'tracking_data') {
            const isEmergencyDetected = !!data.emergency_car_detected;
            setEmergencyDetected(isEmergencyDetected);

            if (serialWriterRef.current) {
              const barrierCmd = isEmergencyDetected ? "OPEN_SERVOS" : "CLOSE_SERVOS";

              if (barrierCmd !== lastBarrierCmdRef.current) {
                const cmd = barrierCmd + "\n"
                const encoder = new TextEncoder()
                serialWriterRef.current.write(encoder.encode(cmd))
                  .then(() => {
                    console.log('Successfully sent Barrier Cmd to Arduino:', barrierCmd)
                    if (isEmergencyDetected) showToast('Emergency Detected - Opening Barriers', 'success')
                    else showToast('Clear - Closing Barriers', 'info')
                  })
                  .catch((err: any) => {
                    console.error("Barrier Serial write error:", err)
                  })
                lastBarrierCmdRef.current = barrierCmd;
              }
            }
          }

          if (data.type === 'tracking_data' && data.data) {
            setTrackingData(prev => {
              const updated = { ...prev }
              for (const [carLabel, carDataRaw] of Object.entries(data.data)) {
                const carData = carDataRaw as {
                  all_times?: number[]
                  all_x?: number[]
                  all_y?: number[]
                  all_velocities?: number[]
                  all_distances?: number[]
                  vel_times?: number[]
                  vel_values?: number[]
                }
                if (!updated[carLabel]) {
                  updated[carLabel] = {
                    times: [],
                    xPositions: [],
                    yPositions: [],
                    velocities: [],
                    distances: [],
                    velTimes: [],
                    velValues: []
                  }
                }
                // Update with latest data
                if (carData.all_times) {
                  updated[carLabel].times = carData.all_times
                  updated[carLabel].xPositions = carData.all_x || []
                  updated[carLabel].yPositions = carData.all_y || []
                  updated[carLabel].velocities = carData.all_velocities || []
                  updated[carLabel].distances = carData.all_distances || []
                  updated[carLabel].velTimes = carData.vel_times || []
                  updated[carLabel].velValues = carData.vel_values || []
                }
              }
              return updated
            })
          }
        } catch (e) {
          console.error('Failed to parse tracking data:', e)
        }
      }

      eventSource.onerror = (err) => {
        console.error('EventSource error:', err)
      }
    }

    if (!res.ok) {
      console.error('Response not OK:', res.status, res.statusText)
      let details = ''
      try {
        const j = await res.json()
        details = j?.details || j?.error || JSON.stringify(j)
        console.error('Error details:', details)
      } catch {
        const text = await res.text()
        details = text || `HTTP ${res.status} ${res.statusText}`
        console.error('Error text:', details)
      }
      const errorMsg = details || `Failed to run detection (HTTP ${res.status})`
      setProcessingError(errorMsg)
      throw new Error(errorMsg)
    }

    const body = res.body
    if (!body) throw new Error('No response body (stream not supported)')

    console.log('Response received, starting to read stream...')
    const reader = body.getReader()
    const decoder = new TextDecoder('ascii')

    let buf = new Uint8Array(0)
    let expectedLen: number | null = null
    let headerEnd = -1

    const canvas = canvasRef.current
    if (!canvas) {
      throw new Error('Canvas element not found')
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas')
    }
    let rendering = false
    console.log('Stream started, canvas ready')

    const append = (a: Uint8Array, b: Uint8Array) => {
      const out = new Uint8Array(a.length + b.length)
      out.set(a, 0)
      out.set(b, a.length)
      return out
    }

    const indexOf = (haystack: Uint8Array, needle: Uint8Array) => {
      outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) {
          if (haystack[i + j] !== needle[j]) continue outer
        }
        return i
      }
      return -1
    }

    const CRLFCRLF = new Uint8Array([13, 10, 13, 10])

    const tryRenderJpeg = async (jpegBytes: Uint8Array) => {
      if (!ctx || !canvas) {
        console.warn('Canvas or context not available')
        return
      }
      if (rendering) {
        // Skip this frame if still rendering previous one
        return
      }
      rendering = true
      try {
        // Check JPEG header (should start with FF D8)
        if (jpegBytes.length < 2 || jpegBytes[0] !== 0xFF || jpegBytes[1] !== 0xD8) {
          console.warn('Invalid JPEG header, skipping frame')
          return
        }

        const ab = jpegBytes.buffer.slice(
          jpegBytes.byteOffset,
          jpegBytes.byteOffset + jpegBytes.byteLength
        ) as ArrayBuffer
        const blob = new Blob([ab], { type: 'image/jpeg' })
        const bmp = await createImageBitmap(blob)
        if (canvas.width !== bmp.width || canvas.height !== bmp.height) {
          console.log(`Setting canvas size: ${bmp.width}x${bmp.height}`)
          canvas.width = bmp.width
          canvas.height = bmp.height
        }
        ctx.drawImage(bmp, 0, 0)
        bmp.close()
      } catch (err) {
        console.error('Error rendering JPEG:', err)
      } finally {
        rendering = false
      }
    }

    let frameCount = 0
    let totalBytes = 0
    while (true) {
      const { value, done } = await reader.read()
      if (done) {
        console.log('Stream ended, total frames:', frameCount, 'total bytes:', totalBytes)
        break
      }
      if (!value) continue

      totalBytes += value.length
      if (frameCount === 0 && totalBytes < 100) {
        console.log('Received first chunk, size:', value.length, 'bytes')
      }
      buf = append(buf, value)

      // Parse MJPEG stream: --frame\r\nContent-Type: image/jpeg\r\nContent-Length: <len>\r\n\r\n<jpeg>\r\n
      while (true) {
        if (expectedLen == null) {
          headerEnd = indexOf(buf, CRLFCRLF)
          if (headerEnd === -1) break

          const headerText = decoder.decode(buf.slice(0, headerEnd))
          const m = headerText.match(/Content-Length:\s*(\d+)/i)
          if (!m) {
            // If we can't find content length, try to skip to next boundary
            const boundaryIdx = indexOf(buf, new Uint8Array([45, 45, 102, 114, 97, 109, 101, 13, 10])) // "--frame\r\n"
            if (boundaryIdx !== -1 && boundaryIdx < headerEnd) {
              buf = buf.slice(boundaryIdx)
              continue
            }
            // Otherwise drop this header block and keep scanning
            buf = buf.slice(headerEnd + 4)
            continue
          }

          expectedLen = Number(m[1])
          if (expectedLen <= 0 || expectedLen > 10 * 1024 * 1024) {
            // Sanity check: frame too large (max 10MB)
            console.warn('Invalid Content-Length:', expectedLen)
            buf = buf.slice(headerEnd + 4)
            expectedLen = null
            continue
          }
          buf = buf.slice(headerEnd + 4)
        }

        if (expectedLen != null) {
          if (buf.length < expectedLen + 2) break // wait for full jpeg + trailing \r\n

          const jpeg = buf.slice(0, expectedLen)
          buf = buf.slice(expectedLen)

          // consume trailing \r\n if present
          if (buf.length >= 2 && buf[0] === 13 && buf[1] === 10) {
            buf = buf.slice(2)
          }

          expectedLen = null
          frameCount++
          if (frameCount === 1) {
            console.log('First frame parsed, size:', jpeg.length, 'bytes')
          }
          if (frameCount % 30 === 0) {
            console.log(`Processed ${frameCount} frames`)
          }
          await tryRenderJpeg(jpeg)
        }
      }
    }
  }

  // Live Mode implementation
  const startLiveMode = async (config: { webcamIp: string; carIps: Record<string, string> }) => {
    console.log('Starting Live Mode with config:', config)
    setProcessingError(null)

    // 1. Seamless Arduino Connection Prompt (Exactly like Camera request)
    const serialOk = await connectSerial()
    if (!serialOk) {
      MySwal.fire('Connection Required', 'To control the traffic lights, you must allow and select the Arduino COM port.', 'warning')
      return
    }

    setIsProcessing(true)

    // Ensure we have a JSON file selected
    if (!selectedJsonFile) {
      setProcessingError('Internal Error: No JSON config file selected.')
      setIsProcessing(false)
      return
    }

    try {
      const fd = new FormData()
      fd.append('webcamIp', config.webcamIp)
      fd.append('carIps', JSON.stringify(config.carIps))
      fd.append('json', selectedJsonFile)
      fd.append('speed', speed.toString())

      console.log('Sending live detection request...')
      const controller = new AbortController()
      streamAbortRef.current = controller

      const res = await fetch('/api/capstone/run-live-detection', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      })

      await handleStreamResponse(res, 'Live Stream', selectedJsonFile.name, speed)
    } catch (e) {
      console.error('Live Mode Error:', e)
      setProcessingError(e instanceof Error ? e.message : 'Failed to start live mode')
    }
    setIsProcessing(false)
  }



  const openLiveConfig = async (selectedJsonFile: File) => {
    if (!selectedJsonFile) {
      // Trigger file input
      const fileInput = jsonInputRef.current
      if (fileInput) {
        setIsWaitingForLiveJson(true)
        fileInput.click()
      }
      return
    }

    try {
      // Fetch config structure
      const text = await selectedJsonFile.text()
      const data = JSON.parse(text)
      const cars = data.cars || []
      const real = cars.filter((c: any) => c.type === 'real')



      // Build inputs for real cars
      let carInputsHtml = ''
      if (real.length > 0) {
        carInputsHtml += `<div class="mt-4"><div class="text-sm font-semibold text-cyan-300 mb-2">Configure Real Cars (IPs):</div>`
        for (const c of real) {
          carInputsHtml += `
            <div class="mb-3">
              <label class="block text-sm text-gray-400 mb-1">${c.id} IP:</label>
              <input id="swal-input-${c.id}" class="swal2-input !m-0 !w-full" placeholder="e.g. 192.168.1.50">
            </div>
          `
        }
        carInputsHtml += `</div>`
      }

      const result = await withReactContent(Swal).fire({
        title: 'Live Stream Configuration',
        background: '#1e293b', // slate-800
        color: '#fff',
        html: `
          <div class="text-left">
            <div class="mb-4">
              <label class="block text-sm text-gray-300 mb-1">Mobile Webcam IP (e.g. 192.168.1.7:8080)</label>
              <input id="swal-input-webcam" class="swal2-input !m-0 !w-full" placeholder="e.g. 192.168.1.10:8080 or http://...">
            </div>
            ${carInputsHtml}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Start Live',
        confirmButtonColor: '#0ea5e9', // sky-500
        cancelButtonColor: '#334155', // slate-700
        preConfirm: () => {
          const webcamIp = (document.getElementById('swal-input-webcam') as HTMLInputElement).value
          if (!webcamIp) {
            Swal.showValidationMessage('Please enter a Webcam IP')
            return false
          }
          const carIps: Record<string, string> = {}
          for (const c of real) {
            const val = (document.getElementById(`swal-input-${c.id}`) as HTMLInputElement).value
            carIps[c.id] = val
          }
          return { webcamIp, carIps }
        }
      })
      if (result.isConfirmed && result.value) {
        setLiveConfig(result.value)
        startLiveMode(result.value)
      }
    } catch (e) {
      console.error('Failed to parse JSON for Live Mode:', e)
      setProcessingError('Failed to parse the selected JSON file.')
    }
  }

  const onPickLive = async () => {
    console.log('onPickLive clicked')
    if (selectedJsonFile) {
      await openLiveConfig(selectedJsonFile)
    } else {
      console.log('No JSON selected, triggering click on ref', jsonInputRef.current)
      setIsWaitingForLiveJson(true)
      if (jsonInputRef.current) {
        jsonInputRef.current.click()
      } else {
        console.error('jsonInputRef is null!')
        alert('Internal Error: File input not found. Please try refreshing.')
      }
    }
  }



  useEffect(() => {
    if (isWaitingForLiveJson && selectedJsonFile) {
      openLiveConfig(selectedJsonFile)
      setIsWaitingForLiveJson(false)
    }
  }, [selectedJsonFile, isWaitingForLiveJson])




  const runDetectionStream = async (file: File, jsonFile?: File | null) => {
    // Require JSON file to be selected before starting
    if (!jsonFile) {
      setProcessingError('Please select a JSON config file first before choosing the video.')
      return
    }

    console.log('Starting detection stream...', { videoName: file.name, jsonName: jsonFile.name, speed })
    setIsProcessing(true)
    setProcessingError(null)

    try {
      const fd = new FormData()
      fd.append('video', file)
      fd.append('json', jsonFile)
      fd.append('speed', speed.toString())

      console.log('FormData created, sending request...')
      const controller = new AbortController()
      streamAbortRef.current = controller

      const res = await fetch('/api/capstone/run-detection-stream', {
        method: 'POST',
        body: fd,
        signal: controller.signal,
      })

      await handleStreamResponse(res, file.name, jsonFile.name, speed)
    } catch (err) {
      console.error('Stream error caught:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Stream aborted by user')
        setProcessingError('Stream stopped by user')
        return
      }
      const msg = err instanceof Error ? err.message : 'Failed to process video stream'
      console.error('Setting error message:', msg)
      setProcessingError(msg)
      setIsProcessing(false)
    }
  }



  const onPickVideo = () => {
    setProcessingError(null)
    videoInputRef.current?.click()
  }

  const onPickJson = () => {
    jsonInputRef.current?.click()
  }

  const startStreamIfReady = async (videoFileOverride?: File | null, jsonFileOverride?: File | null) => {
    const videoFile = videoFileOverride !== undefined ? videoFileOverride : selectedVideoFile
    const jsonFile = jsonFileOverride !== undefined ? jsonFileOverride : selectedJsonFile

    console.log('startStreamIfReady called', { hasVideo: !!videoFile, hasJson: !!jsonFile })

    if (videoFile && jsonFile) {
      // Both files are selected, start the stream
      console.log('Both files ready, starting stream...')
      setProcessingError(null)
      try {
        await runDetectionStream(videoFile, jsonFile)
      } catch (err) {
        console.error('Error in startStreamIfReady:', err)
        const msg = err instanceof Error ? err.message : 'Failed to run detection'
        setProcessingError(msg)
      }
    } else if (videoFile && !jsonFile) {
      // Video selected but no JSON yet
      setProcessingError('Please select a JSON config file to start processing.')
    } else if (!videoFile && jsonFile) {
      // JSON selected but no video yet
      setProcessingError(null) // Clear error, waiting for video
    }
  }

  const onVideoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('onVideoSelected called', e.target.files)
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      setSelectedVideoFile(null)
      setSelectedVideoName(null)
      await startStreamIfReady(null, selectedJsonFile)
      return
    }

    console.log('Video file selected:', file.name, file.size, 'bytes')
    setSelectedVideoName(file.name)
    setSelectedVideoFile(file)
    // allow re-selecting the same file later
    e.target.value = ''
    // Pass the file directly to avoid state update timing issues
    await startStreamIfReady(file, selectedJsonFile)
  }

  const onJsonSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('onJsonSelected called', e.target.files)
    const file = e.target.files?.[0]
    if (file) {
      console.log('JSON file selected:', file.name, file.size, 'bytes')
      setSelectedJsonName(file.name)
      setSelectedJsonFile(file)
    } else {
      console.log('JSON file deselected')
      setSelectedJsonName(null)
      setSelectedJsonFile(null)
    }
    // allow re-selecting the same file later
    e.target.value = ''
    // Pass the file directly to avoid state update timing issues
    await startStreamIfReady(selectedVideoFile, file || null)
  }

  const adjustSpeed = (delta: number) => {
    setSpeed(prev => Math.max(0.1, Math.min(5.0, prev + delta)))
  }
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background */}
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
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-4xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {view === 'main' ? (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-12"
                >
                  <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                  >
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                      Test System
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-xl text-blue-200/80"
                  >
                    Choose a testing option to explore the ITO+ system capabilities
                  </motion.p>
                </motion.div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Detection Button */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <motion.button
                      onClick={() => setView('detection')}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-2 border-cyan-500/30 rounded-3xl p-8 hover:border-cyan-400/50 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                          className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                        >
                          <Camera className="w-10 h-10 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-cyan-300 mb-3">Detection</h3>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                          Test real-time vehicle detection, speed monitoring, and traffic density analysis
                        </p>
                      </div>
                    </motion.button>
                  </motion.div>

                  {/* Create Simulation Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <Link href="/capstone/test/simulation">
                      <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border-2 border-indigo-500/30 rounded-3xl p-8 hover:border-indigo-400/50 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            transition={{ duration: 0.3 }}
                            className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                          >
                            <PlayCircle className="w-10 h-10 text-white" />
                          </motion.div>
                          <h3 className="text-2xl font-bold text-indigo-300 mb-3">Create Simulation</h3>
                          <p className="text-blue-200/80 text-sm leading-relaxed">
                            Build and run traffic simulations to test system performance under various conditions
                          </p>
                        </div>
                      </motion.button>
                    </Link>
                  </motion.div>
                </div>

                {/* Back Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="flex justify-center"
                >
                  <Link href="/capstone">
                    <motion.button
                      whileHover={{ scale: 1.05, x: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group flex items-center gap-3 px-8 py-4 backdrop-blur-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-2 border-blue-500/30 rounded-full font-semibold text-lg text-white hover:border-blue-400/50 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      <span>Back to Home</span>
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="detection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-center mb-12"
                >
                  <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
                  >
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                      Detection
                    </span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-blue-200/80"
                  >
                    Choose your detection method
                  </motion.p>
                </motion.div>

                {/* Detection Buttons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Live Button */}
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <motion.button
                      onClick={onPickLive}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-green-950/50 to-emerald-950/50 border-2 border-green-500/30 rounded-3xl p-8 hover:border-green-400/50 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.3 }}
                          className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                        >
                          <Radio className="w-10 h-10 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-green-300 mb-1">Live</h3>
                        <div className="flex justify-center mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${serialStatus === 'connected' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                            serialStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse' :
                              serialStatus === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/50'
                            }`}>
                            Serial: {serialStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                          Real-time detection from live camera feed
                        </p>
                      </div>
                    </motion.button>
                  </motion.div>

                  {/* Upload Button */}
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <motion.button
                      onClick={onPickVideo}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative w-full backdrop-blur-2xl bg-gradient-to-br from-orange-950/50 to-amber-950/50 border-2 border-orange-500/30 rounded-3xl p-8 hover:border-orange-400/50 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: -5 }}
                          transition={{ duration: 0.3 }}
                          className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg"
                        >
                          <Upload className="w-10 h-10 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-orange-300 mb-3">Upload</h3>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                          Upload video or image files for detection analysis
                        </p>
                      </div>
                    </motion.button>
                  </motion.div>
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={onVideoSelected}
                  className="hidden"
                />
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={onJsonSelected}
                  className="hidden"
                />

                {(selectedVideoName || isProcessing || processingError) && (
                  <div className="backdrop-blur-2xl bg-blue-950/40 border-2 border-cyan-500/20 rounded-3xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <div className="text-lg font-semibold text-cyan-300">Upload Detection</div>
                        {selectedVideoName && (
                          <div className="text-sm text-blue-200/80 break-all">Video: {selectedVideoName}</div>
                        )}
                        {selectedJsonName && (
                          <div className="text-sm text-blue-200/80 break-all">Config: {selectedJsonName}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          onClick={onPickVideo}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-5 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-cyan-400/30 rounded-full text-sm font-semibold text-white hover:border-cyan-400/50 transition-all duration-300"
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          Choose video
                        </motion.button>
                        <motion.button
                          onClick={onPickJson}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-5 py-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-xl border border-purple-400/30 rounded-full text-sm font-semibold text-white hover:border-purple-400/50 transition-all duration-300"
                        >
                          <Upload className="w-4 h-4 inline mr-2" />
                          {selectedJsonName ? 'Change JSON' : 'Add JSON'}
                        </motion.button>
                        {isProcessing && (
                          <motion.button
                            onClick={stopStream}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-5 py-2 bg-red-500/20 backdrop-blur-xl border border-red-400/30 rounded-full text-sm font-semibold text-white hover:border-red-400/50 transition-all duration-300"
                          >
                            Stop
                          </motion.button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <div className="text-sm text-blue-200/80">Speed:</div>
                      <div className="flex items-center gap-2">
                        <motion.button
                          onClick={() => adjustSpeed(-0.1)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={speed <= 0.1}
                          className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </motion.button>
                        <div className="w-16 text-center text-cyan-300 font-semibold">
                          {speed.toFixed(1)}x
                        </div>
                        <motion.button
                          onClick={() => adjustSpeed(0.1)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          disabled={speed >= 5.0}
                          className="w-8 h-8 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>

                    {isProcessing && (
                      <div className="text-blue-200/80 text-sm mt-2">
                        Live processing… frames will appear below.
                      </div>
                    )}

                    {processingError && (
                      <div className="mt-3 text-sm text-red-300 bg-red-950/30 border border-red-400/30 rounded-xl p-3 whitespace-pre-wrap">
                        {processingError}
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="text-sm text-blue-200/80 mb-2">Live view:</div>
                      <div className="w-full rounded-2xl border border-cyan-500/20 bg-black/40 overflow-hidden min-h-[200px] flex items-center justify-center relative">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-auto block max-w-full"
                          style={{ display: 'block' }}
                        />
                        {!isProcessing && !canvasRef.current?.width && (
                          <div className="text-blue-300/50 text-sm">Waiting for video stream...</div>
                        )}

                        {/* Debug Overlays */}
                        {isProcessing && (
                          <div className="absolute top-4 right-4 flex flex-col gap-2">
                            {/* Emergency Status */}
                            <div className={`px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-300 flex items-center gap-3 ${emergencyDetected
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                              : 'bg-slate-900/40 border-slate-700/50 text-slate-400'
                              }`}>
                              <div className={`w-3 h-3 rounded-full ${emergencyDetected ? 'bg-orange-500 animate-pulse' : 'bg-slate-600'}`} />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                {emergencyDetected ? 'EMERGENCY: ORANGE CAR' : 'NORMAL MODE'}
                              </span>
                            </div>

                            {/* Barrier Status (Servo Debug) */}
                            <div className={`px-4 py-2 rounded-xl backdrop-blur-md border transition-all duration-300 flex items-center gap-3 ${lastBarrierCmdRef.current === 'OPEN_SERVOS'
                              ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                              : 'bg-red-500/20 border-red-500/50 text-red-300'
                              }`}>
                              <div className={`w-3 h-3 rounded-full ${lastBarrierCmdRef.current === 'OPEN_SERVOS' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Barrier: {lastBarrierCmdRef.current === 'OPEN_SERVOS' ? 'OPEN' : 'CLOSED'}
                              </span>
                            </div>

                            {/* Manual Red Sequence Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (serialWriterRef.current) {
                                  const cmd = "RED_SEQUENCE\n"
                                  const encoder = new TextEncoder()
                                  serialWriterRef.current.write(encoder.encode(cmd))
                                  MySwal.fire({
                                    title: 'Red Sequence',
                                    text: 'Starting timed red-green cycle...',
                                    icon: 'info',
                                    toast: true,
                                    position: 'top-end',
                                    timer: 3000,
                                    showConfirmButton: false
                                  })
                                } else {
                                  MySwal.fire('Error', 'Connect Arduino first', 'error')
                                }
                              }}
                              className="px-4 py-2 rounded-xl backdrop-blur-md border border-blue-500/50 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-all duration-300 flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            >
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Run Red Sequence (R)
                              </span>
                            </motion.button>
                            {/* Manual Sequence T Button */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (serialWriterRef.current) {
                                  const cmd = "TRAFFIC_SEQ_T\n"
                                  const encoder = new TextEncoder()
                                  serialWriterRef.current.write(encoder.encode(cmd))
                                  MySwal.fire({
                                    title: 'Sequence T',
                                    text: 'Starting 16s traffic cycle...',
                                    icon: 'info',
                                    toast: true,
                                    position: 'top-end',
                                    timer: 3000,
                                    showConfirmButton: false
                                  })
                                } else {
                                  MySwal.fire('Error', 'Connect Arduino first', 'error')
                                }
                              }}
                              className="px-4 py-2 rounded-xl backdrop-blur-md border border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all duration-300 flex items-center gap-3 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                            >
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Run Sequence T (T)
                              </span>
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Real-time Unified Graphs */}
                    {Object.keys(trackingData).length > 0 && (
                      <div className="mt-6 space-y-6">
                        <h3 className="text-xl font-bold text-cyan-300">Real-time Tracking Data (All Cars)</h3>

                        {/* Unified Graphs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Position-Time Graph */}
                          <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                            <div className="text-sm text-cyan-300 mb-2">Position-Time</div>
                            <div className="h-[300px]">
                              <canvas id="pos-chart-unified"></canvas>
                            </div>
                          </div>

                          {/* Velocity-Time Graph */}
                          <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                            <div className="text-sm text-cyan-300 mb-2">Velocity-Time</div>
                            <div className="h-[300px]">
                              <canvas id="vel-chart-unified"></canvas>
                            </div>
                          </div>

                          {/* Distance-Time Graph */}
                          <div className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                            <div className="text-sm text-cyan-300 mb-2">Distance-Time</div>
                            <div className="h-[300px]">
                              <canvas id="dist-chart-unified"></canvas>
                            </div>
                          </div>
                        </div>

                        {/* Current Values for All Cars */}
                        <div className="backdrop-blur-2xl bg-blue-950/40 border-2 border-cyan-500/20 rounded-3xl p-6">
                          <h4 className="text-lg font-semibold text-cyan-300 mb-4">Current Values</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(trackingData).map(([carLabel, data]: [string, any]) => (
                              <div key={carLabel} className="bg-black/40 rounded-xl p-4 border border-cyan-500/20">
                                <div className="text-cyan-300 font-semibold mb-2" style={{ color: getCarColor(carLabel) }}>
                                  {carLabel}
                                </div>
                                <div className="text-sm space-y-1">
                                  <div className="text-blue-200/80">
                                    Position: X: {data.xPositions[data.xPositions.length - 1]?.toFixed(2) || 0} cm,
                                    Y: {data.yPositions[data.yPositions.length - 1]?.toFixed(2) || 0} cm
                                  </div>
                                  <div className="text-blue-200/80">
                                    Velocity: {data.velocities[data.velocities.length - 1]?.toFixed(2) || 0} cm/s
                                  </div>
                                  <div className="text-blue-200/80">
                                    Distance: {data.distances[data.distances.length - 1]?.toFixed(2) || 0} cm
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Back Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex justify-center"
                >
                  <motion.button
                    onClick={() => setView('main')}
                    whileHover={{ scale: 1.05, x: -5 }}
                    whileTap={{ scale: 0.95 }}
                    className="group flex items-center gap-3 px-8 py-4 backdrop-blur-2xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border-2 border-blue-500/30 rounded-full font-semibold text-lg text-white hover:border-blue-400/50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Back</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Load Chart.js from CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Chart.js loaded')
        }}
      />
    </main>
  )
}

