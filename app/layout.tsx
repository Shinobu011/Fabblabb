import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import AIChat from '@/components/AIChat'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FabLab Qena',
  description: 'Welcome to our FabLab - where innovation meets creativity. Explore our machines, meet our team, and book your next project. Made by Yousef Gaber.',
  keywords: 'FabLab, 3D Printing, Laser Cutting, Innovation, Maker Space, Technology, Yousef Gaber',
  icons: {
    icon: '/images/logos/fablab-logo.png',
    shortcut: '/images/logos/fablab-logo.png',
    apple: '/images/logos/fablab-logo.png',
  },
  authors: [{ name: 'Yousef Gaber' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <AIChat />
        </ThemeProvider>
      </body>
    </html>
  )
}
