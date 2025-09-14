export interface AdminPlan {
  id: string;
  name: string;
  minutes: number;
  amount: number;
  active: boolean;
}

export interface AdminSettings {
  freeModeEnabled: boolean;
  maxTicketDuration: number;
  graceSeconds: number;
  turnHost: string;
  turnPort: number;
  turnUsername: string;
  turnPassword: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  country: string;
  isPremium: boolean;
  tokens: number;
  status: 'online' | 'offline' | 'in-call';
  joinedDate: string;
}

export interface MockSession {
  id: string;
  user1: string;
  user2: string;
  duration: number;
  status: 'active' | 'ended';
  startTime: string;
}