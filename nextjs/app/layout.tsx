import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Swipx - Random Video Chat & Swipe',
  description: 'Start random 1:1 video chats and swipe next or left to stop. Modern video chat app with freemium features.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#4f46e5',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}