import { NextRequest, NextResponse } from 'next/server'

// Cleanup expired chat files from database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, inactivityTimeout } = body

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    if (!inactivityTimeout || typeof inactivityTimeout !== 'number') {
      return NextResponse.json(
        { error: 'Inactivity timeout is required' },
        { status: 400 }
      )
    }

    // Proxy to backend VPS
    const response = await fetch('https://api.fablabqena.com/api/ai-chat-cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userEmail, inactivityTimeout }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to cleanup chats on backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error cleaning up chat files:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup chat files' },
      { status: 500 }
    )
  }
}

