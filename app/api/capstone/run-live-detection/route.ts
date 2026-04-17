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
        const webcamIp = formData.get('webcamIp') as string

        const carIpsStr = formData.get('carIps') as string
        const jsonFile = formData.get('json')
        const speedStr = formData.get('speed')

        if (!webcamIp) {
            return NextResponse.json({ error: "Missing 'webcamIp'" }, { status: 400 })
        }
        // ... (lines 19-96 skipped or same)


        if (
            !jsonFile ||
            typeof jsonFile !== 'object' ||
            typeof (jsonFile as any).arrayBuffer !== 'function'
        ) {
            return NextResponse.json({ error: "Missing 'json' config file upload" }, { status: 400 })
        }

        const id = crypto.randomBytes(12).toString('hex')
        const baseDir = path.join(process.cwd(), '.tmp', 'detection')
        const configDir = path.join(baseDir, 'config')
        await fs.mkdir(configDir, { recursive: true })

        // Handle JSON config file
        const jsonUpload = jsonFile as unknown as {
            name?: string
            arrayBuffer: () => Promise<ArrayBuffer>
        }

        // Read the uploaded JSON
        const jsonBuf = Buffer.from(await jsonUpload.arrayBuffer())
        const configData = JSON.parse(jsonBuf.toString('utf-8'))

        // Merge car IPs into the config (if we want to use them in python, 
        // but the python script currently only reads cars_config. 
        // If we need the python script to KNOW about the IPs for some reason (e.g. controlling them), 
        // we should add them. For now, the python script is mainly for detection/visualization.
        // However, the user asked to put IPs, implying they might be used for control or just identification.
        // Let's verify if python script uses IPs. It likely doesn't yet.
        // But we will save the modified config anyway just in case.)

        if (carIpsStr) {
            try {
                const carIps = JSON.parse(carIpsStr)
                if (configData.cars) {
                    const sendPromises: Promise<any>[] = []

                    configData.cars.forEach((car: any) => {
                        const ip = carIps[car.id]
                        if (ip) {
                            car.ip = ip // Update config with IP

                            // Send functions to ESP32 if it's a real car
                            if (car.type === 'real' && car.functions && Array.isArray(car.functions)) {
                                const functionsPayload = car.functions.join('\n')
                                const targetUrl = `http://${ip}/command` // ESP32 endpoint
                                console.log(`Sending functions for car ${car.id} to ${targetUrl}`)

                                const p = fetch(targetUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'text/plain' },
                                    body: functionsPayload
                                })
                                    .then(async res => {
                                        if (!res.ok) console.error(`Failed to send to ${ip}: ${res.status}`)
                                        else console.log(`Functions sent to ${ip} successfully`)
                                    })
                                    .catch(err => console.error(`Error sending to ${ip}:`, err))

                                sendPromises.push(p)
                            }
                        }
                    })

                    // Wait for all commands to be sent (or fail) before starting detection, 
                    // or just fire and forget? 
                    // Better to wait briefly so the cars are ready when stream starts.
                    // But we don't want to hang too long. The requests are async.
                    // We'll let them run in background (fire-and-forget style) to not delay the video stream start,
                    // but since this is Node.js, we should probably ensure they are at least initiated.
                }
            } catch (e) {
                console.error('Failed to parse carIps or send commands:', e)
            }
        }

        const jsonPath = path.join(configDir, `${id}_live_config.json`)
        await fs.writeFile(jsonPath, JSON.stringify(configData, null, 2))
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

        // Use the webcam URL (prepend http:// if missing)
        let inputUrl = webcamIp
        if (!inputUrl.startsWith('http') && !inputUrl.startsWith('rtsp')) {
            inputUrl = `http://${inputUrl}`
        }
        // If user provided specifically /video or similar, keep it. If just IP:Port, usually /video is needed for MJPEG streams or similar.
        // The user said "http://192.168.1.7:8080/video", so we expect full URL or we construct it.
        // Let's assume the user puts the correct full URL or IP:Port/path. 
        // If they just put IP:PORT, we might need to guess the path? Better to assume user provides working URL.

        console.log(`Starting live detection with input: ${inputUrl}, config: ${configPath}`)

        const args = [scriptPath, '--input', inputUrl, '--config', configPath, '--mjpeg', '--realtime', '--speed', speed.toString()]


        const child = spawn(
            pythonBin,
            args,
            {
                cwd: path.dirname(scriptPath),
                windowsHide: true,
                env: process.env,
            }
        )

        // Store process reference for data endpoint (by ID)
        // const processMap = new Map<string, any>() // Logic reused from other file? No, we rely on child process stream.

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
                        console.error('[run-live-detection stderr]', line.trim())
                    }
                }
            }
        })

        child.on('error', (err) => {
            console.error('[run-live-detection] spawn error:', err)
        })

        child.on('exit', (code, signal) => {
            console.log(`[run-live-detection] Python process exited with code ${code}, signal ${signal}`)
        })

        const stream = new ReadableStream<Uint8Array>({
            start(controller) {
                let isClosed = false

                const safeClose = () => {
                    if (!isClosed) {
                        try {
                            controller.close()
                            isClosed = true
                        } catch (e) { }
                    }
                }

                const safeError = (err: Error) => {
                    if (!isClosed) {
                        try {
                            controller.error(err)
                            isClosed = true
                        } catch (e) { }
                    }
                }

                child.stdout.on('data', (chunk: Buffer) => {
                    if (!isClosed) {
                        try {
                            controller.enqueue(new Uint8Array(chunk))
                        } catch (e) {
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
                } catch { }
                if (configPath.startsWith(configDir)) {
                    await fs.unlink(configPath).catch(() => { })
                }
            },
        })

        // Cleanup input and config after process exits
        child.on('close', () => {
            if (configPath.startsWith(configDir)) {
                fs.unlink(configPath).catch(() => { })
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
        console.error('run-live-detection error:', error)
        return NextResponse.json(
            { error: error?.message || 'Failed to run live detection' },
            { status: 500 }
        )
    }
}
