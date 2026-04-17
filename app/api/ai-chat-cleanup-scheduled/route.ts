import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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
          console.log('✅ Scheduled cleanup: deleted expired chat file:', filePath)
        } catch (error) {
          console.error(`Error deleting file ${filePath}:`, error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Scheduled cleanup completed: removed ${totalDeletedCount} expired chat files`,
      deletedCount: totalDeletedCount,
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

