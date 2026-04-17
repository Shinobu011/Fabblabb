import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function runCommand(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      windowsHide: true,
      env: process.env,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (d) => (stdout += d.toString()))
    child.stderr.on('data', (d) => (stderr += d.toString()))

    child.on('close', (code) => resolve({ code: code ?? 0, stdout, stderr }))
    child.on('error', (err) => resolve({ code: 1, stdout, stderr: `${stderr}\n${String(err)}` }))
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('video')

    // In Next.js (nodejs runtime), `File` may not exist as a global.
    // So we avoid `instanceof File` and validate structurally.
    if (
      !file ||
      typeof file !== 'object' ||
      typeof (file as any).arrayBuffer !== 'function'
    ) {
      return NextResponse.json({ error: "Missing 'video' upload" }, { status: 400 })
    }

    const upload = file as unknown as {
      name?: string
      size?: number
      type?: string
      arrayBuffer: () => Promise<ArrayBuffer>
    }

    // Temp paths
    const id = crypto.randomBytes(12).toString('hex')
    const baseDir = path.join(process.cwd(), '.tmp', 'detection')
    const inputDir = path.join(baseDir, 'input')
    const outputDir = path.join(baseDir, 'output')
    await fs.mkdir(inputDir, { recursive: true })
    await fs.mkdir(outputDir, { recursive: true })

    const originalExt = path.extname(upload.name || '') || '.mp4'
    const inputPath = path.join(inputDir, `${id}${originalExt}`)
    const outputPath = path.join(outputDir, `${id}.mp4`)

    const buf = Buffer.from(await upload.arrayBuffer())
    await fs.writeFile(inputPath, buf)

    const scriptPath = path.join(
      process.cwd(),
      'app',
      'capstone',
      'Simulation with detection',
      'best_detection.py'
    )

    // Prefer explicit python binary if provided
    const pythonBin = process.env.PYTHON_BIN || process.env.PYTHON || 'python'

    const { code, stdout, stderr } = await runCommand(
      pythonBin,
      [scriptPath, '--input', inputPath, '--output', outputPath],
      { cwd: path.dirname(scriptPath) }
    )

    if (code !== 0) {
      return NextResponse.json(
        {
          error: 'Detection script failed',
          details: stderr || stdout,
        },
        { status: 500 }
      )
    }

    const outBuf = await fs.readFile(outputPath)
    const outArrayBuffer = outBuf.buffer.slice(
      outBuf.byteOffset,
      outBuf.byteOffset + outBuf.byteLength
    ) as ArrayBuffer
    const outBlob = new Blob([outArrayBuffer], { type: 'video/mp4' })

    // Best-effort cleanup
    await Promise.all([
      fs.unlink(inputPath).catch(() => {}),
      fs.unlink(outputPath).catch(() => {}),
    ])

    return new NextResponse(outBlob, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'inline; filename="processed.mp4"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('run-detection error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to run detection' },
      { status: 500 }
    )
  }
}


