import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Read accounts.json
    const accountsPath = path.join(process.cwd(), 'db', 'accounts.json')
    
    if (!fs.existsSync(accountsPath)) {
      return NextResponse.json(
        { error: 'Accounts database not found' },
        { status: 404 }
      )
    }

    const accountsData = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'))
    const accounts = accountsData.accounts || []
    
    // Find user by email (case-insensitive)
    const user = accounts.find((acc: any) => 
      acc.email?.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user info (without password)
    return NextResponse.json({
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      grade: user.grade || '',
      isStemQena: user.isStemQena || false
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    )
  }
}

