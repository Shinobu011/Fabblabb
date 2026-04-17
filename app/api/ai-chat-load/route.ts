import { NextRequest, NextResponse } from 'next/server'

// Load all active chats for a user from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    // Proxy to backend VPS
    const response = await fetch(`https://api.fablabqena.com/api/ai-chat-load?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to load chats from backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading chats:', error)
    return NextResponse.json(
      { error: 'Failed to load chats' },
      { status: 500 }
    )
  }
}

