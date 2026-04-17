import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory store for tracking data (in production, use Redis or similar)
const dataStore = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))
      
      // Poll for new data
      const interval = setInterval(() => {
        const data = dataStore.get(sessionId) || []
        if (data.length > 0) {
          // Send all pending data
          for (const item of data) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(item)}\n\n`))
          }
          // Clear sent data
          dataStore.set(sessionId, [])
        }
      }, 100) // Poll every 100ms
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// POST endpoint to receive data from the main stream route
export async function POST(request: NextRequest) {
  try {
    const { sessionId, data } = await request.json()
    
    if (!sessionId || !data) {
      return NextResponse.json({ error: 'Missing sessionId or data' }, { status: 400 })
    }
    
    const existing = dataStore.get(sessionId) || []
    existing.push(data)
    dataStore.set(sessionId, existing)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to store data' }, { status: 500 })
  }
}

