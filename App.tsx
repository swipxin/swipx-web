import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Auth } from './components/Auth';
import { Home } from './components/Home';
import { CountrySelect } from './components/CountrySelect';
import { GenderSelect } from './components/GenderSelect';
import { Matching } from './components/Matching';
import { VideoCall } from './components/VideoCall';
import { Wallet } from './components/Wallet';
import { Plans } from './components/Plans';
import { Settings } from './components/Settings';
import { Admin } from './components/Admin';
import { Toaster } from './components/ui/sonner';

export type Screen = 
  | 'onboarding' 
  | 'auth' 
  | 'home' 
  | 'country-select' 
  | 'gender-select' 
  | 'matching' 
  | 'video-call' 
  | 'wallet' 
  | 'plans' 
  | 'settings' 
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  country: string;
  gender: 'male' | 'female' | 'other' | null;
  isPremium: boolean;
  tokens: number;
}

export interface AppState {
  currentScreen: Screen;
  user: User | null;
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  selectedCountry: string | null;
  selectedGender: 'male' | 'female' | 'other' | null;
  isInCall: boolean;
  callDuration: number;
  isDarkMode: boolean;
}

export default function App() {
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
  });

  // Check localStorage for existing session
  useEffect(() => {
    const savedState = localStorage.getItem('swipx-app-state');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setState(prev => ({
        ...prev,
        hasSeenOnboarding: parsed.hasSeenOnboarding || false,
        isDarkMode: parsed.isDarkMode || false,
        currentScreen: parsed.hasSeenOnboarding ? (parsed.isAuthenticated ? 'home' : 'auth') : 'onboarding'
      }));
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('swipx-app-state', JSON.stringify({
      hasSeenOnboarding: state.hasSeenOnboarding,
      isDarkMode: state.isDarkMode,
      isAuthenticated: state.isAuthenticated
    }));
  }, [state.hasSeenOnboarding, state.isDarkMode, state.isAuthenticated]);

  // Apply dark mode
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.isDarkMode]);

  const navigateTo = (screen: Screen) => {
    setState(prev => ({ 
      ...prev, 
      currentScreen: screen,
      isInCall: screen === 'video-call'
    }));
  };

  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null
    }));
  };

  const login = (user: User) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: true,
      currentScreen: 'home'
    }));
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      user: null,
      isAuthenticated: false,
      currentScreen: 'auth'
    }));
  };

  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  };

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true,
      currentScreen: 'auth'
    }));
  };

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'onboarding':
        return <Onboarding onComplete={completeOnboarding} />;
      case 'auth':
        return <Auth onLogin={login} navigateTo={navigateTo} />;
      case 'home':
        return <Home user={state.user} navigateTo={navigateTo} updateUser={updateUser} />;
      case 'country-select':
        return (
          <CountrySelect
            selectedCountry={state.selectedCountry}
            onSelect={(country) => setState(prev => ({ ...prev, selectedCountry: country }))}
            navigateTo={navigateTo}
          />
        );
      case 'gender-select':
        return (
          <GenderSelect
            selectedGender={state.selectedGender}
            onSelect={(gender) => setState(prev => ({ ...prev, selectedGender: gender }))}
            navigateTo={navigateTo}
          />
        );
      case 'matching':
        return (
          <Matching
            user={state.user}
            selectedCountry={state.selectedCountry}
            selectedGender={state.selectedGender}
            navigateTo={navigateTo}
          />
        );
      case 'video-call':
        return (
          <VideoCall
            user={state.user}
            updateUser={updateUser}
            navigateTo={navigateTo}
            callDuration={state.callDuration}
            onDurationUpdate={(duration) => setState(prev => ({ ...prev, callDuration: duration }))}
          />
        );
      case 'wallet':
        return <Wallet user={state.user} updateUser={updateUser} navigateTo={navigateTo} />;
      case 'plans':
        return <Plans user={state.user} updateUser={updateUser} navigateTo={navigateTo} />;
      case 'settings':
        return (
          <Settings
            user={state.user}
            updateUser={updateUser}
            navigateTo={navigateTo}
            isDarkMode={state.isDarkMode}
            toggleDarkMode={toggleDarkMode}
            onLogout={logout}
          />
        );
      case 'admin':
        return <Admin navigateTo={navigateTo} />;
      default:
        return <Home user={state.user} navigateTo={navigateTo} updateUser={updateUser} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {renderScreen()}
      <Toaster />
    </div>
  );
}