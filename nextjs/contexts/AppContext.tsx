'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AppState, User, Screen } from '@/lib/types'

interface AppContextType {
  state: AppState
  navigateTo: (screen: Screen) => void
  updateUser: (updates: Partial<User>) => void
  login: (user: User) => void
  logout: () => void
  toggleDarkMode: () => void
  completeOnboarding: () => void
  updateCallDuration: (duration: number) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>({
    currentScreen: 'onboarding',
    user: null,
    isAuthenticated: false,
    hasSeenOnboarding: false,
    selectedCountry: null,
    selectedGender: null,
    isInCall: false,
    callDuration: 0,
    isDarkMode: false,
  })

  // Check localStorage for existing session
  useEffect(() => {
    const savedState = localStorage.getItem('swipx-app-state')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      setState(prev => ({
        ...prev,
        hasSeenOnboarding: parsed.hasSeenOnboarding || false,
        isDarkMode: parsed.isDarkMode || false,
        currentScreen: parsed.hasSeenOnboarding ? (parsed.isAuthenticated ? 'home' : 'auth') : 'onboarding'
      }))
    }
  }, [])

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('swipx-app-state', JSON.stringify({
      hasSeenOnboarding: state.hasSeenOnboarding,
      isDarkMode: state.isDarkMode,
      isAuthenticated: state.isAuthenticated
    }))
  }, [state.hasSeenOnboarding, state.isDarkMode, state.isAuthenticated])

  // Apply dark mode
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [state.isDarkMode])

  const navigateTo = (screen: Screen) => {
    setState(prev => ({ 
      ...prev, 
      currentScreen: screen,
      isInCall: screen === 'video-call'
    }))
  }

  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }))
  }

  const login = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
      currentScreen: 'home'
    }))
  }

  const logout = () => {
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      currentScreen: 'auth'
    }))
  }

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }))
  }

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true,
      currentScreen: 'auth'
    }))
  }

  const updateCallDuration = (duration: number) => {
    setState(prev => ({ ...prev, callDuration: duration }))
  }

  const value: AppContextType = {
    state,
    navigateTo,
    updateUser,
    login,
    logout,
    toggleDarkMode,
    completeOnboarding,
    updateCallDuration,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}