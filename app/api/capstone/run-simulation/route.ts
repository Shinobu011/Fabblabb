import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const scriptPath = path.join(process.cwd(), 'app', 'capstone', 'Json maker app', 'simulation_maker.py')
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: 'Simulation script not found' },
        { status: 404 }
      )
    }

    // For now, we'll handle JSON generation on the server
    // Since PyQt5 can't run in Node.js, we'll process the data directly
    if (action === 'generate_json') {
      const output = { cars: [] }
      
      for (const car of data.paths || []) {
        const ctrlPx = [car.start_px, ...car.turn_points, car.end_px]
        
        // Convert to cm (matching Python script logic)
        const ORIGIN_X = 400
        const ORIGIN_Y = 300
        const REAL_WIDTH_CM = 121.5
        const REAL_HEIGHT_CM = 151.5
        const scaleX = REAL_WIDTH_CM / 800
        const scaleY = REAL_HEIGHT_CM / 600
        
        const pxToCm = (x: number, y: number) => [
          Math.round(((x - ORIGIN_X) * scaleX) * 100) / 100,
          Math.round(((ORIGIN_Y - y) * scaleY) * 100) / 100
        ]
        
        const ctrlCm = ctrlPx.map((pt: any) => pxToCm(pt.x, pt.y))
        
        // Generate spline (simplified - you may want to implement full Catmull-Rom)
        const splineCm = ctrlCm // Simplified - use control points as spline
        
        output.cars.push({
          id: car.id,
          center_start_point: ctrlCm[0],
          center_end_point: ctrlCm[ctrlCm.length - 1],
          size: car.size,
          moving_start_time: car.moving_start_time || "000",
          moving_end_time: car.moving_end_time || "000",
          color_bgr: car.color_bgr || [0, 0, 0],
          control_points_cm: ctrlCm,
          spline_points_cm: splineCm
        })
      }
      
      return NextResponse.json({ success: true, data: output })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Simulation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to run simulation' },
      { status: 500 }
    )
  }
}

