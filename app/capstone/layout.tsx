import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ITO+ - Intelligent Traffic Observer',
  description: 'An innovative IoT-based intelligent road system for solving traffic congestion in Greater Cairo through machine learning, real-time sensing, and adaptive control.',
  keywords: 'Intelligent Transportation, Traffic Management, IoT, Machine Learning, Greater Cairo, Smart Roads, V2V Communication, ITO Plus',
}

export default function CapstoneLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} bg-slate-950`}>
        {children}
      </body>
    </html>
  )
}
