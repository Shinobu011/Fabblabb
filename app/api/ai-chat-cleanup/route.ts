import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Cleanup expired chat files from database
export async function POST(request: NextRequest) {
  try {
    const { userEmail, inactivityTimeout } = await request.json()

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

    // Sanitize email for filesystem
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_')
    const chatHistoriesDir = path.join(process.cwd(), 'db', 'chat_histories', sanitizedEmail)
    
    if (!fs.existsSync(chatHistoriesDir)) {
      return NextResponse.json({ 
        success: true, 
        message: 'No chat directory found',
        deletedCount: 0
      })
    }

    const currentTime = Date.now()
    const expiredFiles: string[] = []
    const files = fs.readdirSync(chatHistoriesDir)

    // Check each chat file
    for (const file of files) {
      if (!file.endsWith('.json')) continue

      const filePath = path.join(chatHistoriesDir, file)
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const chat = JSON.parse(fileContent)
        
        // Check if chat is expired
        const timeSinceLastActivity = currentTime - (chat.lastActivity || chat.createdAt || chat.startTime || 0)
        if (timeSinceLastActivity >= inactivityTimeout) {
          expiredFiles.push(filePath)
        }
      } catch (error) {
        console.error(`Error reading chat file ${file}:`, error)
        // If file is corrupted, delete it
        expiredFiles.push(filePath)
      }
    }

    // Delete expired files
    let deletedCount = 0
    for (const filePath of expiredFiles) {
      try {
        fs.unlinkSync(filePath)
        deletedCount++
        console.log('✅ Cleaned up expired chat file:', filePath)
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} expired chat files`,
      deletedCount
    })
  } catch (error) {
    console.error('Error cleaning up chat files:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup chat files' },
      { status: 500 }
    )
  }
}

