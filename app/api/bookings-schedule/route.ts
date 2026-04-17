import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  // Redirect to the backend schedule endpoint which reads bookings directly from DB
  // This avoids the Vercel→Backend cross-origin fetch reliability issues
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.fablabqena.com'
  return NextResponse.redirect(`${apiBase}/api/bookings-schedule`, 302)
}