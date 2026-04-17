import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Generate formatted text file from chat history
function generateChatHistoryText(chatHistory: any, userInfo?: {email: string, username: string, phone: string, grade: string}): string {
  let text = '='.repeat(60) + '\n'
  text += '  FabLab Chat History\n'
  text += '='.repeat(60) + '\n\n'
  
  text += `Chat Name: ${chatHistory.chatName || 'Unknown'}\n`
  if (userInfo) {
    text += `User Email: ${userInfo.email || 'Unknown'}\n`
    text += `Username: ${userInfo.username || 'Unknown'}\n`
    text += `Phone: ${userInfo.phone || 'Not provided'}\n`
    text += `Grade: ${userInfo.grade || 'Unknown'}\n`
  } else {
    text += `User: Guest\n`
  }
  text += `Started: ${new Date(chatHistory.startTime || Date.now()).toLocaleString()}\n`
  text += `Ended: ${new Date(chatHistory.endTime || Date.now()).toLocaleString()}\n`
  text += `Duration: ${chatHistory.duration || 'Unknown'}\n`
  text += `Messages: ${chatHistory.messages?.length || 0}\n`
  text += '\n' + '-'.repeat(60) + '\n\n'
  text += 'CONVERSATION:\n'
  text += '-'.repeat(60) + '\n\n'

  const messages = chatHistory.messages || []
  messages.forEach((msg: any, index: number) => {
    const role = msg.role === 'user' ? 'User' : 'Fabby'
    const timestamp = new Date(msg.timestamp || Date.now()).toLocaleString()
    
    text += `[${timestamp}] ${role}:\n`
    
    // Remove HTML tags and clean up content
    let content = msg.content || ''
    content = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
    
    // Indent content
    const lines = content.split('\n')
    lines.forEach((line: string) => {
      text += `  ${line}\n`
    })
    
    text += '\n'
    
    // Add separator between messages
    if (index < messages.length - 1) {
      text += '-'.repeat(60) + '\n\n'
    }
  })

  text += '\n' + '='.repeat(60) + '\n'
  text += `Generated on ${new Date().toLocaleString()} - STEM Qena FabLab\n`
  text += '='.repeat(60) + '\n'

  return text
}

// Send chat history to Discord webhook with text file attachment
async function sendChatHistoryToDiscord(chatHistory: any, userInfo?: {email: string, username: string, phone: string, grade: string}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_CHAT_HISTORY || process.env.DISCORD_WEBHOOK_LOGIN
  if (!webhookUrl) {
    console.log('DISCORD_WEBHOOK_CHAT_HISTORY not configured, skipping chat history notification')
    return
  }

  try {
    const chatName = chatHistory.chatName || chatHistory.chatId || 'Unknown'
    const messages = chatHistory.messages || []
    const messageCount = messages.length
    const duration = chatHistory.duration || 'Unknown'
    
    // Generate formatted text file
    const textContent = generateChatHistoryText(chatHistory, userInfo)
    const textBuffer = Buffer.from(textContent, 'utf-8')
    
    // Create multipart form data manually
    const boundary = `----WebKitFormBoundary${Date.now()}`
    const fileName = `chat-history-${chatHistory.chatId || Date.now()}.txt`
    
    // Build description with user info
    let description = `**Chat:** ${chatName}\n`
    if (userInfo) {
      description += `**User Email:** ${userInfo.email || 'Unknown'}\n`
      description += `**Username:** ${userInfo.username || 'Unknown'}\n`
      description += `**Phone:** ${userInfo.phone || 'Not provided'}\n`
      description += `**Grade:** ${userInfo.grade || 'Unknown'}\n`
    } else {
      description += `**User:** Guest\n`
    }
    description += `**Messages:** ${messageCount}\n`
    description += `**Duration:** ${duration}\n`
    description += `**Started:** ${new Date(chatHistory.startTime || Date.now()).toLocaleString()}\n`
    description += `**Ended:** ${new Date(chatHistory.endTime || Date.now()).toLocaleString()}`
    
    // Create embed message
    const embed = {
      title: '💬 Chat History - Fabby',
      description: description,
      color: 0x3498db, // Blue
      footer: {
        text: 'FabLab Website - AI Chat History'
      },
      timestamp: new Date().toISOString()
    }

    const payload = {
      embeds: [embed]
    }

    // Build multipart form data
    let body = `--${boundary}\r\n`
    body += `Content-Disposition: form-data; name="payload_json"\r\n`
    body += `Content-Type: application/json\r\n\r\n`
    body += JSON.stringify(payload)
    body += `\r\n--${boundary}\r\n`
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`
    body += `Content-Type: text/plain\r\n\r\n`
    
    const bodyBuffer = Buffer.concat([
      Buffer.from(body, 'utf8'),
      textBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
    ])

    // Send to Discord with file
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body: bodyBuffer
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord webhook failed:', response.status, errorText)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send chat history to Discord:', error)
    return false
  }
}

// Save chat history to database file (individual file per chat)
function saveChatHistoryToDB(chatHistory: any, userEmail?: string) {
  try {
    const chatHistoriesDir = path.join(process.cwd(), 'db', 'chat_histories')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(chatHistoriesDir)) {
      fs.mkdirSync(chatHistoriesDir, { recursive: true })
    }
    
    // Generate unique ID if not provided
    const chatId = chatHistory.chatId || `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Create chat history entry
    const historyEntry = {
      id: chatId,
      chatId: chatId,
      chatName: chatHistory.chatName || 'Untitled Chat',
      userEmail: userEmail || 'anonymous',
      messages: chatHistory.messages || [],
      startTime: chatHistory.startTime || Date.now(),
      endTime: chatHistory.endTime || Date.now(),
      duration: chatHistory.duration || 'Unknown',
      savedAt: new Date().toISOString(),
      messageCount: (chatHistory.messages || []).length
    }
    
    // Save as individual file: db/chat_histories/{id}.json
    const filePath = path.join(chatHistoriesDir, `${chatId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(historyEntry, null, 2), 'utf-8')
    console.log('✅ Chat history saved to database:', filePath)
    console.log('   Chat ID:', chatId)
    console.log('   Chat Name:', historyEntry.chatName)
    console.log('   Messages:', historyEntry.messageCount)
    console.log('   User:', userEmail || 'anonymous')
    
    return true
  } catch (error) {
    console.error('Error saving chat history to database:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chatHistory, userInfo } = await request.json()

    if (!chatHistory) {
      return NextResponse.json(
        { error: 'Chat history is required' },
        { status: 400 }
      )
    }

    console.log('📥 Received chat history Discord request:', {
      chatId: chatHistory.chatId,
      chatName: chatHistory.chatName,
      messageCount: (chatHistory.messages || []).length,
      userEmail: userInfo?.email || 'anonymous',
      username: userInfo?.username || 'Unknown'
    })
    
    // Note: Chat file is already deleted from database before this is called
    // This route only sends to Discord webhook
    
    // Send to Discord with text file
    try {
      await sendChatHistoryToDiscord(chatHistory, userInfo)
      console.log('✅ Chat history sent to Discord:', chatHistory.chatId)
    } catch (error) {
      console.error('❌ Failed to send to Discord:', error)
      return NextResponse.json(
        { error: 'Failed to send chat history to Discord' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Chat history sent to Discord successfully',
      chatId: chatHistory.chatId
    })
  } catch (error) {
    console.error('Error processing chat history:', error)
    return NextResponse.json(
      { error: 'Failed to process chat history' },
      { status: 500 }
    )
  }
}
