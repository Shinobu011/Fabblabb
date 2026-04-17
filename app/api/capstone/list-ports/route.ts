import { NextResponse } from 'next/server'
// Import serialport dynamically or rely on it being installed
// Note: serialport is a native module, sometimes tricky with Next.js edge/serverless.
// We force nodejs runtime.
import { SerialPort } from 'serialport'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const ports = await SerialPort.list()
        // Map to simple structure
        const simplePorts = ports.map(p => ({
            path: p.path,
            manufacturer: p.manufacturer || '',
            serialNumber: p.serialNumber || '',
            friendlyName: (p as any).friendlyName || p.path // friendlyName isn't standard in types but often exists on Windows
        }))
        return NextResponse.json(simplePorts)
    } catch (err: any) {
        console.error('Failed to list serial ports:', err)
        return NextResponse.json({ error: 'Failed to list serial ports: ' + err.message }, { status: 500 })
    }
}
