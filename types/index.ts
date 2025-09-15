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