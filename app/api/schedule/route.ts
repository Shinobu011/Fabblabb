import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering - prevent static generation and caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    // We fetch the raw HTML generated from the VPS backend
    // Appending a random timestamp is the ultimate cache buster
    const timestamp = Date.now();
    const res = await fetch(`https://api.fablabqena.com/api/bookings-schedule?cb=${timestamp}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) {
      return new NextResponse(`Error fetching from backend: ${res.statusText}`, { status: 500 });
    }

    const html = await res.text();

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Proxy schedule error:', error);
    return new NextResponse(`Internal Server Error fetching schedule`, { status: 500 });
  }
}
