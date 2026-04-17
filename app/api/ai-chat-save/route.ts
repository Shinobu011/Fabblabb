import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Save or update chat to database file (while active)
export async function POST(request: NextRequest) {
  try {
    const { chat, userEmail } = await request.json()

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

    // Sanitize email for filesystem (replace @ and . with safe characters)
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_')
    const chatHistoriesDir = path.join(process.cwd(), 'db', 'chat_histories', sanitizedEmail)
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(chatHistoriesDir)) {
      fs.mkdirSync(chatHistoriesDir, { recursive: true })
    }
    
    // Save chat as individual file: db/chat_histories/{email}/{chatId}.json
    const filePath = path.join(chatHistoriesDir, `${chat.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(chat, null, 2), 'utf-8')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Chat saved successfully',
      chatId: chat.id
    })
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
    const { chatId, userEmail } = await request.json()

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

    // Sanitize email for filesystem
    const sanitizedEmail = userEmail.replace(/[@.]/g, '_')
    const chatHistoriesDir = path.join(process.cwd(), 'db', 'chat_histories', sanitizedEmail)
    const filePath = path.join(chatHistoriesDir, `${chatId}.json`)
    
    // Delete file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log('✅ Chat file deleted from database:', filePath)
      return NextResponse.json({ 
        success: true, 
        message: 'Chat file deleted successfully',
        chatId
      })
    } else {
      console.log('⚠️ Chat file not found (may have been already deleted):', filePath)
      return NextResponse.json({ 
        success: true, 
        message: 'Chat file not found (already deleted)',
        chatId
      })
    }
  } catch (error) {
    console.error('Error deleting chat file:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat file' },
      { status: 500 }
    )
  }
}

