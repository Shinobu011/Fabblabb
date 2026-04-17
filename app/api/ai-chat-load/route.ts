import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

    // Sanitize email for filesystem
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_')
    const chatHistoriesDir = path.join(process.cwd(), 'db', 'chat_histories', sanitizedEmail)
    
    if (!fs.existsSync(chatHistoriesDir)) {
      return NextResponse.json({ 
        success: true, 
        chats: []
      })
    }

    const files = fs.readdirSync(chatHistoriesDir)
    const chats: any[] = []

    // Load each chat file
    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const filePath = path.join(chatHistoriesDir, file)
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const chat = JSON.parse(fileContent)
        
        // Only include chats that have the required structure
        if (chat.id && chat.messages && Array.isArray(chat.messages)) {
          chats.push(chat)
        }
      } catch (error) {
        console.error(`Error reading chat file ${file}:`, error)
      }
    }

    // Sort by lastActivity (most recent first)
    chats.sort((a, b) => (b.lastActivity || b.createdAt || 0) - (a.lastActivity || a.createdAt || 0))

    return NextResponse.json({ 
      success: true, 
      chats
    })
  } catch (error) {
    console.error('Error loading chats:', error)
    return NextResponse.json(
      { error: 'Failed to load chats' },
      { status: 500 }
    )
  }
}

