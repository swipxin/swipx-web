'use client'

import { AppProvider } from '@/contexts/AppContext'
import { SwipxApp } from '@/components/SwipxApp'

export default function Home() {
  return (
    <AppProvider>
      <SwipxApp />
    </AppProvider>
  )
}