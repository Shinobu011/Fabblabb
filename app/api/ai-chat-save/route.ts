import { NextRequest, NextResponse } from 'next/server'

// Save or update chat to database file (while active)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chat, userEmail } = body

    if (!chat || !chat.id) {
      return NextResponse.json(
        { error: 'Chat data is required' },
        { status: 400 }
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    // Proxy to backend VPS
    const response = await fetch('https://api.fablabqena.com/api/ai-chat-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat, userEmail }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to save chat to backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error saving chat:', error)
    return NextResponse.json(
      { error: 'Failed to save chat' },
      { status: 500 }
    )
  }
}

// Delete chat from database file (when expired/deleted)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, userEmail } = body

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      )
    }

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      )
    }

    // Proxy to backend VPS
    const response = await fetch('https://api.fablabqena.com/api/ai-chat-save', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId, userEmail }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || 'Failed to delete chat from backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error deleting chat file:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat file' },
      { status: 500 }
    )
  }
}

