import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Global cleanup of expired chat files from all users (runs even when logged out)
export async function POST(request: NextRequest) {
  try {
    const { inactivityTimeout } = await request.json()

    if (!inactivityTimeout || typeof inactivityTimeout !== 'number') {
      return NextResponse.json(
        { error: 'Inactivity timeout is required' },
        { status: 400 }
      )
    }

    const chatHistoriesBaseDir = path.join(process.cwd(), 'db', 'chat_histories')
    
    if (!fs.existsSync(chatHistoriesBaseDir)) {
      return NextResponse.json({ 
        success: true, 
        message: 'No chat histories directory found',
        deletedCount: 0
      })
    }

    const currentTime = Date.now()
    let totalDeletedCount = 0
    const userDirs = fs.readdirSync(chatHistoriesBaseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    // Check each user directory
    for (const userDir of userDirs) {
      const userDirPath = path.join(chatHistoriesBaseDir, userDir)
      const files = fs.readdirSync(userDirPath)
      const expiredFiles: string[] = []

      // Check each chat file in this user's directory
      for (const file of files) {
        if (!file.endsWith('.json')) continue

        const filePath = path.join(userDirPath, file)
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

      // Delete expired files for this user
      for (const filePath of expiredFiles) {
        try {
          fs.unlinkSync(filePath)
          totalDeletedCount++
          console.log('✅ Cleaned up expired chat file:', filePath)
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${totalDeletedCount} expired chat files globally`,
      deletedCount: totalDeletedCount
    })
  } catch (error) {
    console.error('Error cleaning up chat files globally:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup chat files' },
      { status: 500 }
    )
  }
}

