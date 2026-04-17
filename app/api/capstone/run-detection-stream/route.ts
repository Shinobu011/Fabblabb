import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video')
    const jsonFile = formData.get('json')
    const speedStr = formData.get('speed')

    if (
      !file ||
      typeof file !== 'object' ||
      typeof (file as any).arrayBuffer !== 'function'
    ) {
      return NextResponse.json({ error: "Missing 'video' upload" }, { status: 400 })
    }

    if (
      !jsonFile ||
      typeof jsonFile !== 'object' ||
      typeof (jsonFile as any).arrayBuffer !== 'function'
    ) {
      return NextResponse.json({ error: "Missing 'json' config file upload" }, { status: 400 })
    }

    const upload = file as unknown as {
      name?: string
      arrayBuffer: () => Promise<ArrayBuffer>
    }

    const id = crypto.randomBytes(12).toString('hex')
    const baseDir = path.join(process.cwd(), '.tmp', 'detection')
    const inputDir = path.join(baseDir, 'input')
    const configDir = path.join(baseDir, 'config')
    await fs.mkdir(inputDir, { recursive: true })
    await fs.mkdir(configDir, { recursive: true })

    const originalExt = path.extname(upload.name || '') || '.mp4'
    const inputPath = path.join(inputDir, `${id}${originalExt}`)
    const buf = Buffer.from(await upload.arrayBuffer())
    await fs.writeFile(inputPath, buf)

    // Handle JSON config file (required)
    const jsonUpload = jsonFile as unknown as {
      name?: string
      arrayBuffer: () => Promise<ArrayBuffer>
    }
    const jsonPath = path.join(configDir, `${id}_config.json`)
    const jsonBuf = Buffer.from(await jsonUpload.arrayBuffer())
    await fs.writeFile(jsonPath, jsonBuf)
    const configPath = jsonPath

    // Parse speed (default 1.0, clamp 0.1-5.0)
    const speed = Math.max(0.1, Math.min(5.0, parseFloat(speedStr?.toString() || '1.0') || 1.0))

    const scriptPath = path.join(
      process.cwd(),
      'app',
      'capstone',
      'Simulation with detection',
      'best_detection.py'
    )

    const pythonBin = process.env.PYTHON_BIN || process.env.PYTHON || 'python'

    const child = spawn(
      pythonBin,
      [scriptPath, '--input', inputPath, '--config', configPath, '--mjpeg', '--realtime', '--speed', speed.toString()],
      {
        cwd: path.dirname(scriptPath),
        windowsHide: true,
        env: process.env,
      }
    )

    // Store process reference for data endpoint (by ID)
    const processMap = new Map<string, any>()
    processMap.set(id, child)
    
    // Store stderr data for this process
    const stderrData: string[] = []
    
    child.stderr.on('data', (d) => {
      const msg = d.toString()
      const lines = msg.split('\n')
      for (const line of lines) {
        if (line.trim()) {
          // Check if it's tracking data (starts with "DATA:")
          if (line.startsWith('DATA:')) {
            const jsonData = line.substring(5) // Remove "DATA:" prefix
            try {
              const parsed = JSON.parse(jsonData)
              // Send data to data endpoint asynchronously
              fetch(`${request.nextUrl.origin}/api/capstone/detection-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: id, data: parsed }),
              }).catch(err => console.error('Failed to send tracking data:', err))
            } catch (e) {
              console.error('Failed to parse tracking data:', e)
            }
          } else {
            // Regular stderr for debugging
            console.error('[run-detection-stream stderr]', line.trim())
          }
        }
      }
    })

    child.on('error', (err) => {
      console.error('[run-detection-stream] spawn error:', err)
    })

    child.on('exit', (code, signal) => {
      console.log(`[run-detection-stream] Python process exited with code ${code}, signal ${signal}`)
    })

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let isClosed = false
        
        const safeClose = () => {
          if (!isClosed) {
            try {
              controller.close()
              isClosed = true
            } catch (e) {
              // Controller already closed, ignore
            }
          }
        }
        
        const safeError = (err: Error) => {
          if (!isClosed) {
            try {
              controller.error(err)
              isClosed = true
            } catch (e) {
              // Controller already closed, ignore
            }
          }
        }
        
        child.stdout.on('data', (chunk: Buffer) => {
          if (!isClosed) {
            try {
              controller.enqueue(new Uint8Array(chunk))
            } catch (e) {
              // Stream closed, ignore
              isClosed = true
            }
          }
        })
        
        child.stdout.on('end', () => {
          safeClose()
        })
        
        child.on('close', (code) => {
          if (code && code !== 0) {
            safeError(new Error(`Detection stream exited with code ${code}`))
          } else {
            safeClose()
          }
        })
        
        child.on('error', (err) => {
          safeError(err instanceof Error ? err : new Error(String(err)))
        })
      },
      async cancel() {
        try {
          child.kill()
        } catch {}
        await fs.unlink(inputPath).catch(() => {})
        // Cleanup config if it was uploaded
        if (configPath.startsWith(configDir)) {
          await fs.unlink(configPath).catch(() => {})
        }
      },
    })

    // Cleanup input and config after process exits
    child.on('close', () => {
      fs.unlink(inputPath).catch(() => {})
      if (configPath.startsWith(configDir)) {
        fs.unlink(configPath).catch(() => {})
      }
    })

    return new NextResponse(stream, {
      status: 200,
      headers: {
        // MJPEG
        'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'X-Session-Id': id, // Send session ID to client
      },
    })
  } catch (error: any) {
    console.error('run-detection-stream error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to run detection stream' },
      { status: 500 }
    )
  }
}


