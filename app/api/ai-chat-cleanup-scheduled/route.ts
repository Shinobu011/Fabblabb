import { NextRequest, NextResponse } from 'next/server'

// Scheduled cleanup endpoint - can be called by cron jobs or external schedulers
// This runs independently of user visits
export async function GET(request: NextRequest) {
  try {
    // Optional: Add a secret token for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production'
    
    // Simple auth check (optional - remove if you want it public)
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get timeout from env or use default
    const timeoutMinutes = parseInt(process.env.NEXT_PUBLIC_CHAT_INACTIVITY_TIMEOUT_MINUTES || '2', 10)
    const inactivityTimeout = timeoutMinutes * 60 * 1000

    // Proxy to backend VPS global cleanup
    const response = await fetch('https://api.fablabqena.com/api/ai-chat-cleanup-global', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inactivityTimeout }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to perform scheduled cleanup on backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      ...data,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in scheduled cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup chat files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Also allow POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}

