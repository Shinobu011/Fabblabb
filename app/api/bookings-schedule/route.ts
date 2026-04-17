import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { addDays } from 'date-fns'

// Set timezone to Egypt (Africa/Cairo) - EET (Eastern European Time, UTC+2)
const EGYPT_TIMEZONE = 'Africa/Cairo'

// Force dynamic rendering - prevent static generation and caching in production
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: NextRequest) {
  try {
    // Instead of generating PDF on server, redirect to a printable page
    // or return HTML that can be printed to PDF
    const htmlContent = await generateHTMLSchedule()
    
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Accel-Buffering': 'no', // Disable nginx buffering if used
      }
    })

  } catch (error) {
    console.error('Error generating schedule:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to generate schedule',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

// Generate HTML schedule that can be printed to PDF
async function generateHTMLSchedule() {
  // Read booking data from the separated backend
  let bookings: any[] = []
  let fetchError = null;
  
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'https://api.fablabqena.com'
    // Add a unique timestamp to force Cloudflare/Vercel to fetch fresh data every time
    const timestamp = Date.now();
    const res = await fetch(`${apiBase}/api/public/bookings?cb=${timestamp}`, { 
        cache: 'no-store',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    })
    if (res.ok) {
        const bookingsData = await res.json()
        bookings = bookingsData.bookings || []
    } else {
        fetchError = `API Error: ${res.status} ${res.statusText}`
    }
  } catch (error) {
    console.error('Error fetching bookings from backend:', error)
    fetchError = error instanceof Error ? error.message : String(error)
  }

  const totalBookingsLoaded = bookings.length;

  // Generate schedule data - use current date in Egypt timezone (EET UTC+2)
  const now = new Date()
  
  // Use date-fns-tz to format time and date in Egypt timezone
  // formatInTimeZone correctly converts UTC to Egypt time (EET UTC+2)
  const generatedDate = formatInTimeZone(now, EGYPT_TIMEZONE, 'EEEE, MMMM d, yyyy')
  const generatedTime = formatInTimeZone(now, EGYPT_TIMEZONE, 'hh:mm a')
  
  const today = now
  const scheduleData = generateScheduleData(today, bookings)

  // Generate HTML with improved design and screenshot functionality
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Bookings Schedule - STEM Qena FabLab</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Modern Color Palette - Teal/Slate */
        :root {
            --primary: #0f766e;
            --primary-dark: #0d5d56;
            --primary-light: #14b8a6;
            --secondary: #475569;
            --accent: #0891b2;
            --bg-light: #f1f5f9;
            --bg-card: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --warning: #f59e0b;
            --error: #ef4444;
            --success-bg: #d1fae5;
            --warning-bg: #fef3c7;
            --error-bg: #fee2e2;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 1cm;
            }
            
            body {
                margin: 0;
                padding: 0;
                background: white;
            }
            
            .no-print {
                display: none;
            }
            
            .header {
                background: var(--primary) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .day-header {
                background: var(--primary) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            th {
                background: var(--primary-dark) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 30px;
            background: var(--bg-light);
            color: var(--text-primary);
            min-height: 100vh;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: var(--bg-card);
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 30px;
            background: var(--primary);
            border-radius: 12px;
            color: white;
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .logo-container img {
            max-height: 70px;
            width: auto;
            filter: brightness(0) invert(1);
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        
        .header h2 {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 16px;
            opacity: 0.95;
        }
        
        .header .meta {
            font-size: 13px;
            opacity: 0.9;
            margin-top: 12px;
        }
        
        .header .meta p {
            margin: 4px 0;
        }
        
        .divider {
            height: 1px;
            background: var(--border);
            margin: 30px 0;
        }
        
        .info-section {
            margin-bottom: 35px;
            padding: 24px;
            background: var(--bg-light);
            border-radius: 10px;
            border-left: 4px solid var(--primary);
        }
        
        .info-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--primary);
        }
        
        .info-section ul {
            list-style: none;
            margin-left: 0;
        }
        
        .info-section li {
            margin-bottom: 10px;
            font-size: 14px;
            padding-left: 20px;
            position: relative;
            color: var(--text-secondary);
        }
        
        .info-section li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--primary);
            font-weight: bold;
            font-size: 18px;
        }
        
        .info-section li strong {
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .day-schedule {
            margin-bottom: 30px;
            page-break-inside: avoid;
            background: var(--bg-card);
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid var(--border);
            position: relative;
        }
        
        .day-header {
            font-size: 18px;
            font-weight: 600;
            padding: 16px 24px;
            background: var(--primary);
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .day-header-content {
            flex: 1;
        }
        
        .screenshot-btn {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 6px 14px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        
        .screenshot-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
        }
        
        .closed {
            color: var(--error);
            font-weight: 600;
            font-size: 16px;
            padding: 40px;
            text-align: center;
            background: var(--error-bg);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: var(--primary-dark);
            color: white;
            padding: 12px 20px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px 20px;
            border-bottom: 1px solid var(--border);
            font-size: 14px;
            color: var(--text-primary);
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:nth-child(even) {
            background: #fafbfc;
        }
        
        tr:hover {
            background: var(--bg-light);
        }
        
        .status-available {
            color: var(--success);
            font-weight: 600;
            padding: 4px 10px;
            background: var(--success-bg);
            border-radius: 6px;
            display: inline-block;
            font-size: 12px;
        }
        
        .status-limited {
            color: var(--warning);
            font-weight: 600;
            padding: 4px 10px;
            background: var(--warning-bg);
            border-radius: 6px;
            display: inline-block;
            font-size: 12px;
        }
        
        .status-full {
            color: var(--error);
            font-weight: 600;
            padding: 4px 10px;
            background: var(--error-bg);
            border-radius: 6px;
            display: inline-block;
            font-size: 12px;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: var(--text-secondary);
            padding: 24px;
            background: var(--bg-light);
            border-radius: 10px;
        }
        
        .footer p {
            margin: 6px 0;
        }
        
        .print-button {
            position: fixed;
            top: 30px;
            right: 30px;
            background: var(--primary);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
            font-family: 'Inter', sans-serif;
        }
        
        .print-button:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
            box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
        }
        
        .time-slot {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .bookings-count {
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .group-numbers {
            font-family: 'Courier New', monospace;
            color: var(--primary);
            font-weight: 500;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print/PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img src="/images/logos/fablab-logo.png" alt="FabLab Logo" />
            </div>
            <h1>STEM Qena FabLab</h1>
            <h2>Daily Bookings Schedule</h2>
            <div class="meta">
                <p>📅 Generated: ${generatedDate} at ${generatedTime}</p>
                <p>🔄 Updates in real-time with each booking approval/rejection</p>
                ${fetchError ? `<p style="color: #ffcccc; font-weight: bold; margin-top: 10px;">⚠️ Connection Error: ${fetchError}</p>` : ''}
            </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-section">
            <h3>Operating Hours</h3>
            <ul>
                <li>Sunday - Wednesday: 8:00 AM - 3:00 PM (Last booking: 1:00 PM)</li>
                <li>Thursday: 8:00 AM - 12:00 PM (Last booking: 11:00 AM)</li>
                <li>Friday - Saturday: Closed</li>
            </ul>
            <br>
            <ul>
                <li><strong>Maximum 2 bookings per time slot</strong></li>
                <li><strong>Only STEM Qena members can make bookings</strong></li>
            </ul>
        </div>
        
        <div class="divider"></div>
        
        ${scheduleData.map((day, index) => `
            <div class="day-schedule" id="day-schedule-${index}">
                <div class="day-header">
                    <div class="day-header-content">${day.dateLabel}</div>
                    ${!day.isClosed ? `<button class="screenshot-btn no-print" onclick="screenshotDay(${index})" title="Screenshot this day">📷 Screenshot</button>` : ''}
                </div>
                ${day.isClosed ? 
                    '<p class="closed">CLOSED</p>' : 
                    `<table>
                        <thead>
                            <tr>
                                <th>Time Slot</th>
                                <th>Bookings</th>
                                <th>Group Numbers</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${day.timeSlots.map(slot => `
                                <tr>
                                    <td class="time-slot">${slot.time}</td>
                                    <td class="bookings-count">${slot.bookings}/${slot.maxBookings}</td>
                                    <td class="group-numbers">${slot.groupNumbers && slot.groupNumbers.length > 0 ? slot.groupNumbers.join(', ') : '-'}</td>
                                    <td><span class="status-${slot.status}">${slot.statusText}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
                }
            </div>
        `).join('')}
        
        <div class="footer">
            <p><strong>System Status:</strong> Bookings Found: ${totalBookingsLoaded}</p>
            ${totalBookingsLoaded > 0 ? `<p style="font-size: 10px; color: #94a3b8;">Debug Data 1: [${bookings[0].date}] at [${bookings[0].time}] status: [${bookings[0].status}]</p>` : ''}
            <p>This schedule is automatically updated in real-time whenever a booking is approved or rejected</p>
            <p>For questions or issues, contact the FabLab administration</p>
        </div>
    </div>
    
    <script>
        async function screenshotDay(dayIndex) {
            const element = document.getElementById('day-schedule-' + dayIndex);
            if (!element) return;
            
            const button = element.querySelector('.screenshot-btn');
            const originalText = button.textContent;
            button.textContent = '⏳ Processing...';
            button.disabled = true;
            
            try {
                // Use html2canvas to capture the element
                const canvas = await html2canvas(element, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: false
                });
                
                // Convert canvas to blob and download
                canvas.toBlob(function(blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    const dayName = element.querySelector('.day-header-content').textContent.replace(/[^a-zA-Z0-9]/g, '-');
                    link.download = 'fablab-schedule-' + dayName + '.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    button.textContent = originalText;
                    button.disabled = false;
                }, 'image/png');
            } catch (error) {
                console.error('Screenshot failed:', error);
                alert('Failed to take screenshot. Please try again.');
                button.textContent = originalText;
                button.disabled = false;
            }
        }
    </script>
</body>
</html>`

  return html
}

// Generate schedule data for the next 7 days
// All dates are calculated based on Egypt timezone (EET UTC+2)
function generateScheduleData(startDate: Date, bookings: any[]) {
  const scheduleData = []
  
  // Get current date/time in Egypt timezone (EET UTC+2)
  const nowInEgypt = toZonedTime(startDate, EGYPT_TIMEZONE)
  
  for (let i = 0; i < 7; i++) {
    // Calculate target date in Egypt timezone by adding i days
    const targetDateInEgypt = addDays(nowInEgypt, i)
    
    // Format date string in Egypt timezone
    const dateStr = formatInTimeZone(targetDateInEgypt, EGYPT_TIMEZONE, 'yyyy-MM-dd')
    
    // Get day name in Egypt timezone to determine day of week accurately
    const dayName = formatInTimeZone(targetDateInEgypt, EGYPT_TIMEZONE, 'EEEE')
    
    // Map day name to day of week number (0=Sunday, 6=Saturday)
    const dayNameToNumber: { [key: string]: number } = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    }
    const dayOfWeek = dayNameToNumber[dayName] ?? 0
    
    // Format date label in Egypt timezone
    const dateLabel = formatInTimeZone(targetDateInEgypt, EGYPT_TIMEZONE, 'EEEE, MMM d') + ` (${dateStr})`
    
    const dayData = {
      date: dateStr,
      dateLabel: dateLabel,
      isClosed: dayOfWeek >= 5, // Friday (5) and Saturday (6) are closed
      timeSlots: [] as any[]
    }
    
    if (!dayData.isClosed) {
      // Generate time slots based on your booking rules
      const lastHour = dayOfWeek === 4 ? 11 : 13 // Thursday last slot 11:00, others 13:00 (1PM)
      
      for (let hour = 8; hour <= lastHour; hour++) {
        const timeStr = formatTime(hour)
        const slotData = getBookingCountForSlot(dateStr, timeStr, bookings)
        const bookingsCount = slotData.count
        const groupNumbers = slotData.groupNumbers
        const maxBookings = 2
        
        let status = 'available'
        let statusText = 'Available'
        
        if (bookingsCount === 0) {
          status = 'available'
          statusText = 'Available'
        } else if (bookingsCount < maxBookings) {
          status = 'limited'
          statusText = 'Limited'
        } else {
          status = 'full'
          statusText = 'Full'
        }
        
        dayData.timeSlots.push({
          time: timeStr,
          bookings: bookingsCount,
          groupNumbers: groupNumbers,
          maxBookings: maxBookings,
          status: status,
          statusText: statusText
        })
      }
    }
    
    scheduleData.push(dayData)
  }
  
  return scheduleData
}

// Format time in 12-hour format
function formatTime(hour24: number): string {
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const padded = hour12 < 10 ? `0${hour12}` : `${hour12}`
  return `${padded}:00 ${period}`
}

// Get booking count and group numbers for a specific date and time slot
function getBookingCountForSlot(date: string, time: string, bookings: any[]): { count: number, groupNumbers: string[] } {
  // Normalize search parameters
  const targetDate = date.trim();
  const targetTime = time.trim().toLowerCase();
  
  // Get approved bookings for this slot
  const slotBookings = bookings.filter((booking: any) => {
    if (!booking.date || !booking.time || booking.status !== 'approved') return false;
    
    const bDate = String(booking.date).trim();
    const bTime = String(booking.time).trim().toLowerCase();
    
    // Match date: literal match or startsWith (to handle partial timestamps/spaces)
    const dateMatch = bDate === targetDate || bDate.startsWith(targetDate) || targetDate.startsWith(bDate);
    
    // Match time: allow 09:00 AM to match 9:00 AM
    // We remove leading zeros and remove all spaces for comparison
    const normalizeTime = (t: string) => t.replace(/^0/, '').replace(/\s+/g, '').toLowerCase();
    const timeMatch = normalizeTime(bTime) === normalizeTime(targetTime);
    
    return dateMatch && timeMatch;
  })
  
  const groupNumbers = slotBookings
    .map((booking: any) => booking.groupNumber)
    .filter((num: any) => num !== undefined && num !== null)
    .map((num: any) => `G${num}`)
  
  return {
    count: slotBookings.length,
    groupNumbers: groupNumbers
  }
}