import type { AdminPlan, AdminSettings, MockUser, MockSession } from './types';

export const INITIAL_PLANS: AdminPlan[] = [
  { id: '1', name: 'Test Drive', minutes: 1, amount: 0, active: true },
  { id: '2', name: 'Premium', minutes: 20, amount: 100, active: true }
];

export const INITIAL_SETTINGS: AdminSettings = {
  freeModeEnabled: true,
  maxTicketDuration: 30,
  graceSeconds: 10,
  turnHost: 'turn.swipx.com',
  turnPort: 3478,
  turnUsername: 'swipx-user',
  turnPassword: 'secure-password'
};

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    country: 'India',
    isPremium: true,
    tokens: 120,
    status: 'online',
    joinedDate: '2024-01-15'
  },
  {
    id: '2',
    name: 'Sarah Smith',
    email: 'sarah@example.com',
    country: 'Canada',
    isPremium: false,
    tokens: 25,
    status: 'in-call',
    joinedDate: '2024-01-20'
  },
  {
    id: '3',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    country: 'UK',
    isPremium: true,
    tokens: 75,
    status: 'offline',
    joinedDate: '2024-01-18'
  }
];

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: '1',
    user1: 'John Doe',
    user2: 'Sarah Smith',
    duration: 180,
    status: 'active',
    startTime: '14:30'
  },
  {
    id: '2',
    user1: 'Alex Johnson',
    user2: 'Maria Garcia',
    duration: 450,
    status: 'ended',
    startTime: '13:15'
  }
];