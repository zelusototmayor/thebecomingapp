export type Importance = 'low' | 'med' | 'high';

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  provider: 'google' | 'email';
}

export interface Goal {
  id: string;
  title: string;
  note: string;
  importance: Importance;
  northStar: string;
  whyItMatters: string;
  createdAt: number;
}

export type CheckInType = 'goal' | 'identity';

export interface CheckIn {
  id: string;
  type: CheckInType;
  goalId: string | null;
  date: number;
  response: 'yes' | 'somewhat' | 'no';
  reflection: string;
}

export type Tone = 'gentle' | 'direct' | 'motivational';

export type SignalType = 'inquiry' | 'manifesto' | 'insight';
export type SignalFeedback = 'like' | 'dislike' | 'none';
export type SignalTargetType = 'goal' | 'identity';

export interface Signal {
  id: string;
  text: string;
  timestamp: number;
  type: SignalType;
  feedback: SignalFeedback;
  targetType: SignalTargetType;
  targetIdentity?: string;
}

export interface Settings {
  notificationFrequency: 2 | 3 | 7;
  notificationTone: Tone;
  notificationTime: string;
  notificationDays: string[];
  hasOnboarded: boolean;
}

export interface AppState {
  user: User | null;
  goals: Goal[];
  mainMission: string;
  checkIns: CheckIn[];
  signals: Signal[];
  settings: Settings;
  currentGoalIndex: number;
}

export const DEFAULT_SETTINGS: Settings = {
  notificationFrequency: 2,
  notificationTone: 'gentle',
  notificationTime: '10:00',
  notificationDays: ['Mon', 'Wed', 'Fri'],
  hasOnboarded: false,
};

export const DEFAULT_APP_STATE: AppState = {
  user: null,
  goals: [],
  mainMission: '',
  checkIns: [],
  signals: [],
  settings: DEFAULT_SETTINGS,
  currentGoalIndex: 0,
};

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SyncPayload {
  goals: Goal[];
  checkIns: CheckIn[];
  signals: Signal[];
  settings: Settings;
  mainMission: string;
  currentGoalIndex: number;
}
