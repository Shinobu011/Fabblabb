'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Car, Download, Upload, Trash2, Edit, Grid, Save } from 'lucide-react'

interface Point {
  x: number
  y: number
  stopTime?: string
}

interface CarPath {
  id: string
  start_px: Point
  turn_points: Point[]
  end_px: Point
  size: [number, number]
  color: string
  color_bgr?: [number, number, number]
  moving_start_time: string
  time_to_reach_points: number[] // Time (in seconds) to reach each point from start
  type: 'simulated'
}

interface RealCar {
  id: string
  type: 'real'
  functions: string[] // Array of function calls like "forward(250);", "sleep(3000);"
}

export default function SimulationMakerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'draw' | 'select'>('draw')
  const [paths, setPaths] = useState<CarPath[]>([])
  const [realCars, setRealCars] = useState<RealCar[]>([])
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null)
  const [selectedRealCarIndex, setSelectedRealCarIndex] = useState<number | null>(null)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [endPoint, setEndPoint] = useState<Point | null>(null)
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 })
  const [selectedColor, setSelectedColor] = useState('#00ff00')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'point' | 'segment'
    pathIndex: number
    pointIndex?: number
    pointType?: 'start' | 'turn' | 'end'
    segmentIndex?: number
  } | null>(null)

  const GRID_SPACING = 50
  const REAL_WIDTH_CM = 121.5
  const REAL_HEIGHT_CM = 151.5

  const getDimensions = () => {
    // Prefer canvas intrinsic size (device pixels)
    const canvas = canvasRef.current
    if (canvas) {
      return { width: canvas.width, height: canvas.height }
    }
    // Fallback to natural image size
    const img = imageRef.current
    if (img) {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      return { width: w, height: h }
    }
    return { width: imageSize.width, height: imageSize.height }
  }

  // Calculate origin based on current image size (match Python: image center)
  const getOrigin = () => {
    const { width, height } = getDimensions()
    return {
      x: width / 2,
      y: height / 2
    }
  }

  const debugLogPaths = (label: string, pathsToLog: CarPath[]) => {
    const { width, height } = getDimensions()
    const origin = getOrigin()
    const scaleX = REAL_WIDTH_CM / width
    const scaleY = REAL_HEIGHT_CM / height

    console.group(`[ITO+ debug] ${label}`)
    console.log('image', { width, height, origin, scaleX, scaleY })
    pathsToLog.forEach((p) => {
      const ctrlPx = [p.start_px, ...p.turn_points, p.end_px]
      const ctrlCm = ctrlPx.map((pt) => {
        const cx = (pt.x - origin.x) * scaleX
        const cy = (origin.y - pt.y) * scaleY
        return [Math.round(cx * 1000) / 1000, Math.round(cy * 1000) / 1000]
      })
      console.log(p.id, {
        px: ctrlPx,
        cm: ctrlCm,
        color: p.color,
        color_bgr: p.color_bgr
      })
    })
    console.groupEnd()
  }

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [paths, startPoint, endPoint, mode, selectedPathIndex, zoom, pan, imageLoaded, imageSize])

  // Close context menu on outside click / escape / scroll
  useEffect(() => {
    if (!contextMenu) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null)
    }

    const handleGlobalMouseDown = () => {
      setContextMenu(null)
    }

    const handleScrollOrResize = () => {
      setContextMenu(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleGlobalMouseDown)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleGlobalMouseDown)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [contextMenu])

  // Keyboard event listener for deselection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'l' || e.key === 'L') {
        if (selectedPathIndex !== null) {
          setSelectedPathIndex(null)
          setDragStart(null)
          setIsDragging(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [selectedPathIndex])

  const handleImageLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        const naturalW = img.naturalWidth || img.width
        const naturalH = img.naturalHeight || img.height
        setImageSize({ width: naturalW, height: naturalH })
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = naturalW
          canvas.height = naturalH
          // Reset zoom and pan when loading new image
          setZoom(1)
          setPan({ x: 0, y: 0 })
        }
        setImageLoaded(true)
        // Draw after a small delay to ensure canvas is ready
        setTimeout(() => drawCanvas(), 100)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, imageSize.width, imageSize.height)

    // Draw grid
    if (snapEnabled) {
      ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)'
      ctx.lineWidth = 1
      for (let x = 0; x < imageSize.width; x += GRID_SPACING) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, imageSize.height)
        ctx.stroke()
      }
      for (let y = 0; y < imageSize.height; y += GRID_SPACING) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(imageSize.width, y)
        ctx.stroke()
      }
    }

    // Draw origin
    const origin = getOrigin()
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(origin.x, 0)
    ctx.lineTo(origin.x, imageSize.height)
    ctx.moveTo(0, origin.y)
    ctx.lineTo(imageSize.width, origin.y)
    ctx.stroke()
    ctx.fillStyle = '#00ffff'
    ctx.beginPath()
    ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Draw paths
    paths.forEach((path, idx) => {
      const isSelected = idx === selectedPathIndex
      ctx.strokeStyle = path.color
      ctx.lineWidth = isSelected ? 4 : 2
      ctx.fillStyle = path.color

      const points = [path.start_px, ...path.turn_points, path.end_px]
      const spline = catmullRomSpline(points)

      ctx.beginPath()
      ctx.moveTo(spline[0].x, spline[0].y)
      for (let i = 1; i < spline.length; i++) {
        ctx.lineTo(spline[i].x, spline[i].y)
      }
      ctx.stroke()

      // Draw control points
      points.forEach((pt) => {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    })

    // Draw preview line
    if (mode === 'draw' && startPoint && endPoint) {
      ctx.strokeStyle = '#ffff00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(endPoint.x, endPoint.y)
      ctx.stroke()
      ctx.setLineDash([])
    }

    ctx.restore()
  }

  const catmullRomSpline = (points: Point[]): Point[] => {
    if (points.length <= 2) return points

    const extended = [points[0], ...points, points[points.length - 1]]
    const result: Point[] = []

    for (let i = 0; i < extended.length - 3; i++) {
      const p0 = extended[i]
      const p1 = extended[i + 1]
      const p2 = extended[i + 2]
      const p3 = extended[i + 3]

      for (let j = 0; j < 20; j++) {
        const t = j / 20
        const t2 = t * t
        const t3 = t2 * t

        const x = 0.5 * (
          2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        )
        const y = 0.5 * (
          2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        )
        result.push({ x, y })
      }
    }
    result.push(points[points.length - 1])
    return result
  }

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const distPointToSegmentSq = (p: Point, a: Point, b: Point) => {
    const abx = b.x - a.x
    const aby = b.y - a.y
    const apx = p.x - a.x
    const apy = p.y - a.y
    const abLenSq = abx * abx + aby * aby
    const t = abLenSq === 0 ? 0 : (apx * abx + apy * aby) / abLenSq
    const tt = clamp(t, 0, 1)
    const cx = a.x + tt * abx
    const cy = a.y + tt * aby
    const dx = p.x - cx
    const dy = p.y - cy
    return dx * dx + dy * dy
  }

  const catmullRomPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
    const t2 = t * t
    const t3 = t2 * t
    const x = 0.5 * (
      2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    )
    const y = 0.5 * (
      2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
    return { x, y }
  }

  const minDistToSplineSegmentSq = (target: Point, p0: Point, p1: Point, p2: Point, p3: Point) => {
    // polyline approximation: 20 samples (same as drawing)
    let prev = catmullRomPoint(p0, p1, p2, p3, 0)
    let best = Number.POSITIVE_INFINITY
    for (let j = 1; j <= 20; j++) {
      const cur = catmullRomPoint(p0, p1, p2, p3, j / 20)
      best = Math.min(best, distPointToSegmentSq(target, prev, cur))
      prev = cur
    }
    return best
  }

  const ensureTimeToReachPointsLength = (path: CarPath) => {
    const pointCount = 2 + path.turn_points.length // start + end + turn points
    const times = Array.isArray(path.time_to_reach_points) ? [...path.time_to_reach_points] : []
    // First point is always at time 0, so we need times for remaining points
    const needed = pointCount - 1
    if (times.length < needed) {
      // Default: each segment takes 2 seconds
      const lastTime = times.length > 0 ? times[times.length - 1] : 0
      const defaultIncrement = 2.0
      times.push(...new Array(needed - times.length).fill(0).map((_, i) => lastTime + (i + 1) * defaultIncrement))
    }
    if (times.length > needed) times.length = needed
    return { ...path, time_to_reach_points: times }
  }

  const snapPoint = (x: number, y: number): Point => {
    if (!snapEnabled) return { x, y }
    return {
      x: Math.round(x / GRID_SPACING) * GRID_SPACING,
      y: Math.round(y / GRID_SPACING) * GRID_SPACING
    }
  }

  const widgetToImage = (x: number, y: number): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    // Calculate the scale factor between displayed size and actual canvas size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Get mouse position relative to canvas element (before zoom/pan)
    // First convert to canvas coordinates accounting for display scaling
    const canvasX = x * scaleX
    const canvasY = y * scaleY

    // Then account for zoom and pan
    return {
      x: (canvasX - pan.x) / zoom,
      y: (canvasY - pan.y) / zoom
    }
  }

  const pxToCm = (x: number, y: number): [number, number] => {
    const origin = getOrigin()
    const { width, height } = getDimensions()
    const scaleX = REAL_WIDTH_CM / width
    const scaleY = REAL_HEIGHT_CM / height
    // Match Python's px_to_cm exactly: (x - origin_x) * scale_x, (origin_y - y) * scale_y
    const cx = (x - origin.x) * scaleX
    const cy = (origin.y - y) * scaleY
    return [cx, cy]
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    // Get mouse position relative to canvas
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Account for zoom and pan
    const imgPoint = widgetToImage(x, y)
    const snapped = snapPoint(imgPoint.x, imgPoint.y)

    // Ensure point is within canvas bounds
    if (snapped.x < 0 || snapped.x > imageSize.width || snapped.y < 0 || snapped.y > imageSize.height) {
      return
    }

    if (mode === 'draw') {
      if (!startPoint) {
        setStartPoint(snapped)
      } else {
        setEndPoint(snapped)
        // Convert hex to rgb
        const hex = selectedColor.replace('#', '')
        const r = parseInt(hex.substr(0, 2), 16)
        const g = parseInt(hex.substr(2, 2), 16)
        const b = parseInt(hex.substr(4, 2), 16)
        const color = `rgb(${r}, ${g}, ${b})`

        // Generate ID in format 001_S, 002_S, etc.
        const simulatedCarCount = paths.filter(p => p.type === 'simulated').length
        const newId = String(simulatedCarCount + 1).padStart(3, '0') + '_S'

        const newPath: CarPath = {
          id: newId,
          start_px: { ...startPoint, stopTime: '000' },
          turn_points: [],
          end_px: { ...snapped, stopTime: '000' },
          size: [18, 9],
          color,
          color_bgr: [b, g, r], // store BGR directly to avoid parsing later
          moving_start_time: '000',
          time_to_reach_points: [2.0], // Default: reach end point in 2 seconds
          type: 'simulated'
        }
        setPaths([...paths, newPath])

        // Log info when line is finalized (on mouse up placing end point)
        const { height } = getDimensions()
        console.log('[ITO+ line created]', {
          image_height: height,
          start_px: newPath.start_px,
          end_px: newPath.end_px
        })
        setStartPoint(null)
        setEndPoint(null)
      }
    } else if (mode === 'select') {
      // Find nearest point
      interface NearestPoint {
        index: number
        point: Point
        type: 'start' | 'end' | 'turn'
        turnIndex?: number
      }
      let nearest: NearestPoint | null = null
      let minDist = 144 // 12^2

      for (let idx = 0; idx < paths.length; idx++) {
        const path = paths[idx]
        const distStart = (path.start_px.x - snapped.x) ** 2 + (path.start_px.y - snapped.y) ** 2
        if (distStart < minDist) {
          nearest = { index: idx, point: path.start_px, type: 'start' }
          minDist = distStart
        }

        const distEnd = (path.end_px.x - snapped.x) ** 2 + (path.end_px.y - snapped.y) ** 2
        if (distEnd < minDist) {
          nearest = { index: idx, point: path.end_px, type: 'end' }
          minDist = distEnd
        }

        for (let ti = 0; ti < path.turn_points.length; ti++) {
          const tp = path.turn_points[ti]
          const dist = (tp.x - snapped.x) ** 2 + (tp.y - snapped.y) ** 2
          if (dist < minDist) {
            nearest = { index: idx, point: tp, type: 'turn', turnIndex: ti }
            minDist = dist
          }
        }
      }

      if (nearest !== null) {
        setSelectedPathIndex(nearest.index)
        setDragStart(nearest.point)
        setIsDragging(true)
      } else {
        // Clicking empty space deselects
        setSelectedPathIndex(null)
        setDragStart(null)
        setIsDragging(false)
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const imgPoint = widgetToImage(x, y)
    const snapped = snapPoint(imgPoint.x, imgPoint.y)

    if (mode === 'draw' && startPoint) {
      setEndPoint(snapped)
    }

    if (mode === 'select' && isDragging && selectedPathIndex !== null && dragStart) {
      const dx = snapped.x - dragStart.x
      const dy = snapped.y - dragStart.y
      const updatedPaths = [...paths]
      const path = updatedPaths[selectedPathIndex]

      // Update the dragged point (preserve stopTime)
      if (path.start_px.x === dragStart.x && path.start_px.y === dragStart.y) {
        path.start_px = { ...snapped, stopTime: path.start_px.stopTime || '000' }
      } else if (path.end_px.x === dragStart.x && path.end_px.y === dragStart.y) {
        path.end_px = { ...snapped, stopTime: path.end_px.stopTime || '000' }
      } else {
        const turnIdx = path.turn_points.findIndex(tp => tp.x === dragStart.x && tp.y === dragStart.y)
        if (turnIdx !== -1) {
          path.turn_points[turnIdx] = { ...snapped, stopTime: path.turn_points[turnIdx].stopTime || '000' }
        }
      }

      setPaths(updatedPaths)
      setDragStart(snapped)
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'select' || selectedPathIndex === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const imgPoint = widgetToImage(x, y)
    const snapped = snapPoint(imgPoint.x, imgPoint.y)

    const updatedPaths = [...paths]
    const path = updatedPaths[selectedPathIndex]
    path.turn_points.push({ ...snapped, stopTime: '000' })
    // Add a default time for the new point (2 seconds after previous point)
    const lastTime = path.time_to_reach_points.length > 0
      ? path.time_to_reach_points[path.time_to_reach_points.length - 1]
      : 0
    path.time_to_reach_points.push(lastTime + 2.0)
    setPaths(updatedPaths)
  }

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return

    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const imgPoint = widgetToImage(x, y)
    const snapped = snapPoint(imgPoint.x, imgPoint.y)

    // First check if clicking on a point
    let nearestPoint: { pathIndex: number; pointType: 'start' | 'turn' | 'end'; pointIndex?: number } | null = null
    let minDist = 144 // 12^2

    for (let idx = 0; idx < paths.length; idx++) {
      const path = paths[idx]

      const distStart = (path.start_px.x - snapped.x) ** 2 + (path.start_px.y - snapped.y) ** 2
      if (distStart < minDist) {
        nearestPoint = { pathIndex: idx, pointType: 'start' }
        minDist = distStart
      }

      const distEnd = (path.end_px.x - snapped.x) ** 2 + (path.end_px.y - snapped.y) ** 2
      if (distEnd < minDist) {
        nearestPoint = { pathIndex: idx, pointType: 'end' }
        minDist = distEnd
      }

      for (let ti = 0; ti < path.turn_points.length; ti++) {
        const tp = path.turn_points[ti]
        const dist = (tp.x - snapped.x) ** 2 + (tp.y - snapped.y) ** 2
        if (dist < minDist) {
          nearestPoint = { pathIndex: idx, pointType: 'turn', pointIndex: ti }
          minDist = dist
        }
      }
    }

    if (nearestPoint) {
      setSelectedPathIndex(nearestPoint.pathIndex)
      setSelectedRealCarIndex(null)
      // Show context menu for point (stopTime)
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'point',
        pathIndex: nearestPoint.pathIndex,
        pointType: nearestPoint.pointType,
        pointIndex: nearestPoint.pointIndex
      })
      return
    }

    // If not a point, find nearest spline segment (between control points)
    let bestSeg: { pathIndex: number; segmentIndex: number; distSq: number } | null = null
    for (let idx = 0; idx < paths.length; idx++) {
      const path = paths[idx]
      const ctrl = [path.start_px, ...path.turn_points, path.end_px]
      if (ctrl.length < 2) continue

      const extended = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]]
      for (let segIdx = 0; segIdx < ctrl.length - 1; segIdx++) {
        const p0 = extended[segIdx]
        const p1 = extended[segIdx + 1]
        const p2 = extended[segIdx + 2]
        const p3 = extended[segIdx + 3]
        const d = minDistToSplineSegmentSq(snapped, p0, p1, p2, p3)
        if (!bestSeg || d < bestSeg.distSq) bestSeg = { pathIndex: idx, segmentIndex: segIdx, distSq: d }
      }
    }

    // 22px threshold
    if (bestSeg && bestSeg.distSq < 22 * 22) {
      setSelectedPathIndex(bestSeg.pathIndex)
      setSelectedRealCarIndex(null)

      // normalize time_to_reach_points length before editing
      const updatedPaths = [...paths]
      updatedPaths[bestSeg.pathIndex] = ensureTimeToReachPointsLength(updatedPaths[bestSeg.pathIndex])
      setPaths(updatedPaths)

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        type: 'segment',
        pathIndex: bestSeg.pathIndex,
        segmentIndex: bestSeg.segmentIndex
      })
    }
  }

  const generateJSON = async () => {
    try {
      const { width, height } = getDimensions()
      const output: { cars: any[]; meta: any } = { cars: [], meta: { image_width_px: width, image_height_px: height } }

      debugLogPaths('before-save (px/cm)', paths)

      const origin = getOrigin()
      const scaleX = REAL_WIDTH_CM / width
      const scaleY = REAL_HEIGHT_CM / height

      // Add simulated cars (with paths)
      paths.forEach((car) => {
        const ctrlPx = [car.start_px, ...car.turn_points, car.end_px]

        // Convert to cm and round to 3 decimal places (matching Python code)
        const ctrlCm = ctrlPx.map((pt) => {
          const cx = (pt.x - origin.x) * scaleX
          const cy = (origin.y - pt.y) * scaleY
          return [Math.round(cx * 1000) / 1000, Math.round(cy * 1000) / 1000]
        })

        const splinePx = catmullRomSpline(ctrlPx)
        // Convert spline to cm and round to 3 decimal places
        const splineCm = splinePx.map(({ x, y }) => {
          const cx = (x - origin.x) * scaleX
          const cy = (origin.y - y) * scaleY
          return [Math.round(cx * 1000) / 1000, Math.round(cy * 1000) / 1000]
        })

        const colorBgr = car.color_bgr || [0, 0, 0]

        // Extract stopTimes from points
        const stopTimes = [
          car.start_px.stopTime || '000',
          ...car.turn_points.map(tp => tp.stopTime || '000'),
          car.end_px.stopTime || '000'
        ]

        output.cars.push({
          id: car.id,
          center_start_point: ctrlCm[0],
          center_end_point: ctrlCm[ctrlCm.length - 1],
          size: car.size,
          moving_start_time: car.moving_start_time || "000",
          color_bgr: colorBgr,
          control_points_cm: ctrlCm,
          spline_points_cm: splineCm,
          time_to_reach_points: car.time_to_reach_points || [],
          stop_times: stopTimes,
          type: 'simulated'
        })
      })

      // Add real cars
      realCars.forEach((car) => {
        output.cars.push({
          id: car.id,
          type: 'real',
          functions: car.functions
        })
      })

      const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'cars_config.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating JSON:', error)
      alert('Error generating JSON. Please try again.')
    }
  }


  const clearPaths = () => {
    setPaths([])
    setRealCars([])
    setSelectedPathIndex(null)
    setSelectedRealCarIndex(null)
    setStartPoint(null)
    setEndPoint(null)
  }

  const deleteSelected = () => {
    if (selectedPathIndex !== null) {
      setPaths(paths.filter((_, idx) => idx !== selectedPathIndex))
      setSelectedPathIndex(null)
    }
  }

  const loadJSON = () => {
    if (!imageLoaded) {
      alert('Please load an image first')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          // Reset pan/zoom to avoid offsetting loaded paths
          setPan({ x: 0, y: 0 })
          setZoom(1)

          const data = JSON.parse(event.target?.result as string)
          const loadedPaths: CarPath[] = []
          const loadedRealCars: RealCar[] = []
          const meta = data.meta || {}

          if (data.cars && Array.isArray(data.cars)) {
            data.cars.forEach((car: any) => {
              // Handle real cars
              if (car.type === 'real' || (car.functions && !car.control_points_cm)) {
                loadedRealCars.push({
                  id: car.id || `real_${loadedRealCars.length + 1}`,
                  type: 'real',
                  functions: car.functions || ['forward(250);', 'sleep(3000);']
                })
                return
              }

              // Handle simulated cars (with paths)
              if (car.control_points_cm && car.control_points_cm.length > 0) {
                // Calculate scale based on saved metadata when available
                const { width: curW, height: curH } = getDimensions()
                const w = meta.image_width_px || curW
                const h = meta.image_height_px || curH
                const scaleX = REAL_WIDTH_CM / w
                const scaleY = REAL_HEIGHT_CM / h

                const origin = {
                  x: w / 2,
                  y: h / 2
                }
                const cmToPx = (cx: number, cy: number): Point => {
                  // Reverse px_to_cm formula from Python:
                  // Python: cx = (x - origin_x) * scale_x, cy = (origin_y - y) * scale_y
                  // So to reverse: x = origin_x + (cx / scale_x), y = origin_y - (cy / scale_y)
                  return {
                    x: origin.x + (cx / scaleX),
                    y: origin.y - (cy / scaleY)
                  }
                }

                const ctrl = car.control_points_cm
                const start = ctrl[0]
                const end = ctrl[ctrl.length - 1]
                const turns = ctrl.slice(1, -1)

                const startPx = cmToPx(start[0], start[1])
                const endPx = cmToPx(end[0], end[1])
                const turnPx: Point[] = turns.map((tp: number[]) => cmToPx(tp[0], tp[1]))

                // Convert BGR to RGB: color_bgr is [B, G, R]
                const bgr = car.color_bgr || [0, 0, 0]
                const color = `rgb(${bgr[2]}, ${bgr[1]}, ${bgr[0]})`

                // Preserve existing IDs or generate new ones
                const existingSimulatedCount = paths.filter(p => p.type === 'simulated').length
                const loadedSimulatedCount = loadedPaths.filter(p => p.type === 'simulated').length
                let carId = car.id
                if (!carId || !carId.endsWith('_S')) {
                  carId = String(existingSimulatedCount + loadedSimulatedCount + 1).padStart(3, '0') + '_S'
                }

                // Extract stopTimes and time_to_reach_points from car data if available
                const stopTimes = car.stop_times || []
                const timeToReachPoints = car.time_to_reach_points || []

                // If time_to_reach_points not in JSON, calculate defaults (2 seconds per segment)
                let times = timeToReachPoints
                if (times.length === 0) {
                  const pointCount = 2 + turnPx.length
                  times = []
                  for (let i = 1; i < pointCount; i++) {
                    times.push(i * 2.0) // 2s, 4s, 6s, etc.
                  }
                }

                loadedPaths.push({
                  id: carId,
                  start_px: {
                    ...startPx,
                    stopTime: stopTimes[0] || '000'
                  },
                  turn_points: turnPx.map((tp: Point, idx: number) => ({
                    ...tp,
                    stopTime: stopTimes[idx + 1] || '000'
                  })),
                  end_px: {
                    ...endPx,
                    stopTime: stopTimes[stopTimes.length - 1] || stopTimes[turnPx.length + 1] || '000'
                  },
                  size: car.size || [18, 9],
                  color,
                  color_bgr: bgr,
                  moving_start_time: car.moving_start_time || '000',
                  time_to_reach_points: times,
                  type: 'simulated'
                })
              }
            })
          }

          debugLogPaths('after-load (px/cm)', loadedPaths)
          const { height } = getDimensions()
          loadedPaths.forEach((p) => {
            console.log('[ITO+ load]', {
              image_height: height,
              start_px: p.start_px,
              end_px: p.end_px,
              meta_width: meta.image_width_px,
              meta_height: meta.image_height_px
            })
          })
          // Merge with existing paths and real cars instead of replacing
          setPaths([...paths, ...loadedPaths])
          setRealCars([...realCars, ...loadedRealCars])
          alert(`Added ${loadedPaths.length} simulated car(s) and ${loadedRealCars.length} real car(s) to existing cars`)
        } catch (error) {
          console.error('Error loading JSON:', error)
          alert('Error loading JSON file. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white relative overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-blue-950/40 border-b border-cyan-500/20 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent">
                  ITO<sub className="text-lg text-cyan-400">+</sub>
                </h1>
                <p className="text-xs text-blue-300/70">Simulation Maker</p>
              </div>
            </div>
            <Link href="/capstone/test">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-blue-950/40 border border-cyan-500/30 rounded-full text-sm font-semibold text-white hover:border-cyan-400/50 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <br />
      <br />
      <br />
      <br />
      <div className="pt-8 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <div className="backdrop-blur-2xl bg-blue-950/40 border-2 border-cyan-500/20 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold text-cyan-300 mb-4">Controls</h2>

                {/* Image Loader */}
                {!imageLoaded && (
                  <div className="border-2 border-dashed border-cyan-500/30 rounded-lg p-4 text-center">
                    <p className="text-blue-200/80 mb-3">Load an image to start</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageLoad}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 rounded-lg font-semibold text-white hover:border-cyan-400/60 transition-all"
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Load Image
                    </button>
                  </div>
                )}

                {imageLoaded && (
                  <>
                    <div className="space-y-2">
                      <button
                        onClick={() => setMode('draw')}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${mode === 'draw'
                          ? 'bg-cyan-500/30 text-cyan-300 border-2 border-cyan-400'
                          : 'bg-blue-950/50 text-blue-200 border border-blue-500/30'
                          }`}
                      >
                        Draw Mode
                      </button>
                      <button
                        onClick={() => setMode('select')}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${mode === 'select'
                          ? 'bg-cyan-500/30 text-cyan-300 border-2 border-cyan-400'
                          : 'bg-blue-950/50 text-blue-200 border border-blue-500/30'
                          }`}
                      >
                        Select Mode
                      </button>
                    </div>

                    {/* Color Picker */}
                    {mode === 'draw' && (
                      <div className="space-y-2">
                        <label className="text-sm text-blue-200/80">Path Color:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-full h-10 rounded-lg cursor-pointer border border-cyan-500/30"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                <button
                  onClick={() => setSnapEnabled(!snapEnabled)}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition-all ${snapEnabled
                    ? 'bg-green-500/30 text-green-300 border-2 border-green-400'
                    : 'bg-blue-950/50 text-blue-200 border border-blue-500/30'
                    }`}
                >
                  <Grid className="w-4 h-4 inline mr-2" />
                  Snap: {snapEnabled ? 'ON' : 'OFF'}
                </button>

                <div className="border-t border-cyan-500/20 pt-4 space-y-2">
                  <button
                    onClick={generateJSON}
                    className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 rounded-lg font-semibold text-white hover:border-cyan-400/60 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Generate JSON
                  </button>
                  {imageLoaded && (
                    <button
                      onClick={loadJSON}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-500/30 to-indigo-500/30 border border-purple-400/40 rounded-lg font-semibold text-white hover:border-purple-400/60 transition-all flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Load JSON
                    </button>
                  )}
                  <button
                    onClick={clearPaths}
                    className="w-full px-4 py-2 bg-red-500/20 border border-red-400/30 rounded-lg font-semibold text-red-300 hover:border-red-400/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                  {selectedPathIndex !== null && (
                    <button
                      onClick={deleteSelected}
                      className="w-full px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-lg font-semibold text-orange-300 hover:border-orange-400/50 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Selected
                    </button>
                  )}
                </div>

                <div className="border-t border-cyan-500/20 pt-4">
                  <p className="text-sm text-blue-200/70 mb-2">Simulated Cars: {paths.length}</p>
                  <p className="text-sm text-blue-200/70 mb-2">Real Cars: {realCars.length}</p>

                  {/* Add Real Car Button */}
                  <button
                    onClick={() => {
                      const newRealCar: RealCar = {
                        id: `real_${realCars.length + 1}`,
                        type: 'real',
                        functions: ['forward(250);', 'sleep(3000);']
                      }
                      setRealCars([...realCars, newRealCar])
                      setSelectedRealCarIndex(realCars.length)
                      setSelectedPathIndex(null)
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border border-green-400/40 rounded-lg font-semibold text-white hover:border-green-400/60 transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    <Car className="w-4 h-4" />
                    Add Real Car
                  </button>

                  {selectedPathIndex !== null && (
                    <div className="space-y-3">
                      <p className="text-sm text-cyan-300 font-semibold">Selected: {paths[selectedPathIndex]?.id}</p>

                      {/* Edit Path Properties */}
                      <div className="space-y-2">
                        <label className="text-xs text-blue-200/80">Moving Start Time:</label>
                        <input
                          type="text"
                          value={paths[selectedPathIndex]?.moving_start_time || '000'}
                          onChange={(e) => {
                            const updatedPaths = [...paths]
                            updatedPaths[selectedPathIndex].moving_start_time = e.target.value
                            setPaths(updatedPaths)
                          }}
                          className="w-full px-3 py-2 bg-blue-950/50 border border-cyan-500/30 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                          placeholder="000"
                        />
                        <div className="mt-2 rounded-lg border border-cyan-500/20 bg-blue-950/30 p-3 text-xs text-blue-200/70 space-y-1">
                          <p>
                            <span className="text-cyan-300 font-semibold">Tip:</span> Right-click a <span className="text-blue-100">point</span> to edit <span className="text-blue-100">stopTime</span>.
                          </p>
                          <p>
                            <span className="text-cyan-300 font-semibold">Tip:</span> Right-click a <span className="text-blue-100">path segment</span> to edit <span className="text-blue-100">time to reach point</span>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedRealCarIndex !== null && (
                    <div className="space-y-3 mt-4">
                      <p className="text-sm text-green-300 font-semibold">Real Car: {realCars[selectedRealCarIndex]?.id}</p>

                      {/* Edit Real Car ID */}
                      <div className="space-y-2">
                        <label className="text-xs text-blue-200/80">Car ID:</label>
                        <input
                          type="text"
                          value={realCars[selectedRealCarIndex]?.id || ''}
                          onChange={(e) => {
                            const updatedRealCars = [...realCars]
                            updatedRealCars[selectedRealCarIndex].id = e.target.value
                            setRealCars(updatedRealCars)
                          }}
                          className="w-full px-3 py-2 bg-blue-950/50 border border-green-500/30 rounded-lg text-sm text-white focus:border-green-400/50 focus:outline-none"
                          placeholder="real_1"
                        />
                      </div>

                      {/* Edit Functions */}
                      <div className="space-y-2">
                        <label className="text-xs text-blue-200/80">Functions:</label>
                        <div className="space-y-2">
                          {realCars[selectedRealCarIndex]?.functions.map((func, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={func}
                                onChange={(e) => {
                                  const updatedRealCars = [...realCars]
                                  updatedRealCars[selectedRealCarIndex].functions[idx] = e.target.value
                                  setRealCars(updatedRealCars)
                                }}
                                className="flex-1 px-2 py-1 bg-blue-950/50 border border-green-500/30 rounded text-xs text-white focus:border-green-400/50 focus:outline-none font-mono"
                                placeholder="forward(250);"
                              />
                              <button
                                onClick={() => {
                                  const updatedRealCars = [...realCars]
                                  updatedRealCars[selectedRealCarIndex].functions.splice(idx, 1)
                                  setRealCars(updatedRealCars)
                                }}
                                className="px-2 py-1 bg-red-500/20 border border-red-400/30 rounded text-xs text-red-300 hover:border-red-400/50"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const updatedRealCars = [...realCars]
                                updatedRealCars[selectedRealCarIndex].functions.push('forward(250);')
                                setRealCars(updatedRealCars)
                              }}
                              className="flex-1 px-2 py-1 bg-green-500/20 border border-green-400/30 rounded text-xs text-green-300 hover:border-green-400/50"
                            >
                              + forward
                            </button>
                            <button
                              onClick={() => {
                                const updatedRealCars = [...realCars]
                                updatedRealCars[selectedRealCarIndex].functions.push('sleep(3000);')
                                setRealCars(updatedRealCars)
                              }}
                              className="flex-1 px-2 py-1 bg-green-500/20 border border-green-400/30 rounded text-xs text-green-300 hover:border-green-400/50"
                            >
                              + sleep
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setRealCars(realCars.filter((_, idx) => idx !== selectedRealCarIndex))
                          setSelectedRealCarIndex(null)
                        }}
                        className="w-full px-3 py-2 bg-red-500/20 border border-red-400/30 rounded-lg text-xs font-semibold text-red-300 hover:border-red-400/50 transition-all"
                      >
                        Delete Real Car
                      </button>
                    </div>
                  )}

                  {/* Real Cars List */}
                  {realCars.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="text-xs text-blue-200/80">Real Cars:</label>
                      {realCars.map((car, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedRealCarIndex(idx)
                            setSelectedPathIndex(null)
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${selectedRealCarIndex === idx
                            ? 'bg-green-500/30 text-green-300 border-2 border-green-400'
                            : 'bg-blue-950/50 text-blue-200 border border-blue-500/30 hover:border-green-400/50'
                            }`}
                        >
                          {car.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3">
              <div className="backdrop-blur-2xl bg-blue-950/40 border-2 border-cyan-500/20 rounded-2xl p-6">
                {!imageLoaded ? (
                  <div className="bg-black rounded-lg p-20 text-center border-2 border-dashed border-cyan-500/30">
                    <Upload className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
                    <p className="text-blue-200/70 text-lg mb-4">Please load an image to start</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/40 rounded-lg font-semibold text-white hover:border-cyan-400/60 transition-all"
                    >
                      Load Image
                    </button>
                  </div>
                ) : (
                  <div className="bg-black rounded-lg overflow-hidden relative">
                    <div className="relative inline-block">
                      <canvas
                        ref={canvasRef}
                        width={imageSize.width}
                        height={imageSize.height}
                        className="cursor-crosshair block"
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                        onClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onDoubleClick={handleDoubleClick}
                        onWheel={(e) => {
                          e.preventDefault()
                          const delta = e.deltaY > 0 ? 0.9 : 1.1
                          setZoom(prev => Math.max(0.2, Math.min(5, prev * delta)))
                        }}
                        onContextMenu={handleCanvasRightClick}
                      />
                    </div>
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded text-sm">
                      Mode: {mode === 'draw' ? 'Draw' : 'Select'} | Zoom: {Math.round(zoom * 100)}%
                    </div>
                  </div>
                )}
                <div className="mt-4 text-sm text-blue-200/70">
                  <p>• Draw Mode: Click to set start point, click again to set end point</p>
                  <p>• Select Mode: Click and drag to move points, double-click to add turn point</p>
                  <p>• Press "L" key to deselect current path</p>
                  <p>• Right-click a point to set stopTime, or a segment to set time to reach point</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-[9999]"
          onMouseDown={() => setContextMenu(null)}
        >
          <div
            className="fixed min-w-[220px] max-w-[320px] rounded-xl border border-cyan-500/30 bg-slate-950/95 backdrop-blur-xl shadow-2xl p-4"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="text-sm font-semibold text-cyan-200">
                {contextMenu.type === 'point' ? 'Point stopTime' : 'Time to reach point'}
              </div>
              <button
                className="px-2 py-1 text-xs rounded border border-cyan-500/20 text-blue-200/70 hover:text-blue-100 hover:border-cyan-400/40"
                onClick={() => setContextMenu(null)}
              >
                Close
              </button>
            </div>

            <div className="text-xs text-blue-200/70 mb-3">
              Path: <span className="text-blue-100">{paths[contextMenu.pathIndex]?.id || '—'}</span>
            </div>

            {contextMenu.type === 'segment' && contextMenu.segmentIndex !== undefined && (
              <div className="space-y-2">
                <label className="text-xs text-blue-200/80">
                  Time to reach point {(contextMenu.segmentIndex ?? 0) + 2} (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={0.1}
                  value={paths[contextMenu.pathIndex]?.time_to_reach_points?.[contextMenu.segmentIndex!] ?? ((contextMenu.segmentIndex ?? 0) + 1) * 2.0}
                  onChange={(e) => {
                    const v = Math.max(0, parseFloat(e.target.value) || 0)
                    const updatedPaths = [...paths]
                    updatedPaths[contextMenu.pathIndex] = ensureTimeToReachPointsLength(updatedPaths[contextMenu.pathIndex])
                    updatedPaths[contextMenu.pathIndex].time_to_reach_points[contextMenu.segmentIndex!] = v
                    setPaths(updatedPaths)
                  }}
                  className="w-full px-3 py-2 bg-blue-950/50 border border-cyan-500/30 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                />
                <div className="text-xs text-blue-200/50">
                  Time from start to reach this point
                </div>
              </div>
            )}

            {contextMenu.type === 'point' && contextMenu.pointType && (
              <div className="space-y-2">
                <label className="text-xs text-blue-200/80">
                  stopTime (default 000) — {contextMenu.pointType === 'turn' ? `turn ${((contextMenu.pointIndex ?? 0) + 1)}` : contextMenu.pointType}
                </label>
                <input
                  type="text"
                  value={
                    contextMenu.pointType === 'start'
                      ? paths[contextMenu.pathIndex]?.start_px.stopTime || '000'
                      : contextMenu.pointType === 'end'
                        ? paths[contextMenu.pathIndex]?.end_px.stopTime || '000'
                        : paths[contextMenu.pathIndex]?.turn_points?.[contextMenu.pointIndex ?? 0]?.stopTime || '000'
                  }
                  onChange={(e) => {
                    const updatedPaths = [...paths]
                    const p = updatedPaths[contextMenu.pathIndex]
                    const newValue = e.target.value
                    if (contextMenu.pointType === 'start') {
                      p.start_px = { ...p.start_px, stopTime: newValue }
                    } else if (contextMenu.pointType === 'end') {
                      p.end_px = { ...p.end_px, stopTime: newValue }
                    } else if (contextMenu.pointType === 'turn') {
                      const idx = contextMenu.pointIndex ?? 0
                      p.turn_points[idx] = { ...p.turn_points[idx], stopTime: newValue }
                    }
                    setPaths(updatedPaths)
                  }}
                  className="w-full px-3 py-2 bg-blue-950/50 border border-cyan-500/30 rounded-lg text-sm text-white focus:border-cyan-400/50 focus:outline-none"
                  placeholder="000"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

