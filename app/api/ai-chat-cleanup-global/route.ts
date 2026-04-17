import { NextRequest, NextResponse } from 'next/server'

// Global cleanup of expired chat files from all users (runs even when logged out)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inactivityTimeout } = body

    if (!inactivityTimeout || typeof inactivityTimeout !== 'number') {
      return NextResponse.json(
        { error: 'Inactivity timeout is required' },
        { status: 400 }
      )
    }

    // Proxy to backend VPS
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
        { error: errorData.error || 'Failed to cleanup chats globally on backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error cleaning up chat files globally:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup chat files' },
      { status: 500 }
    )
  }
}

