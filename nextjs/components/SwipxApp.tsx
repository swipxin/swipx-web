'use client'

import { useApp } from '@/contexts/AppContext'
import { Onboarding } from './screens/Onboarding'
import { Auth } from './screens/Auth'
import { Home } from './screens/Home'
import { CountrySelect } from './screens/CountrySelect'
import { GenderSelect } from './screens/GenderSelect'
import { Matching } from './screens/Matching'
import { VideoCall } from './screens/VideoCall'
import { Wallet } from './screens/Wallet'
import { Plans } from './screens/Plans'
import { Settings } from './screens/Settings'
import { Admin } from './screens/Admin'

export function SwipxApp() {
  const { state } = useApp()

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'onboarding':
        return <Onboarding />
      case 'auth':
        return <Auth />
      case 'home':
        return <Home />
      case 'country-select':
        return <CountrySelect />
      case 'gender-select':
        return <GenderSelect />
      case 'matching':
        return <Matching />
      case 'video-call':
        return <VideoCall />
      case 'wallet':
        return <Wallet />
      case 'plans':
        return <Plans />
      case 'settings':
        return <Settings />
      case 'admin':
        return <Admin />
      default:
        return <Home />
    }
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {renderScreen()}
    </div>
  )
}