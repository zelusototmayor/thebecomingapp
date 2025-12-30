import { CONFIG } from '../constants/config';
import { getTokens, storeTokens, clearTokens } from './auth';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  requiresAuth?: boolean;
}

interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = CONFIG.apiUrl;
  }

  private async refreshTokens(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) {
          return false;
        }

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
          await clearTokens();
          return false;
        }

        const data = await response.json();
        await storeTokens(data.tokens.accessToken, data.tokens.refreshToken);
        return true;
      } catch {
        await clearTokens();
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, requiresAuth = true } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && requiresAuth) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        // Retry the request with new token
        const tokens = await getTokens();
        if (tokens?.accessToken) {
          headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!retryResponse.ok) {
          const error: ApiError = await retryResponse.json();
          throw new Error(error.error || 'Request failed');
        }

        return retryResponse.json();
      } else {
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.request<{
      user: { id: string; email: string; name: string; photoUrl?: string; provider: string };
      tokens: { accessToken: string; refreshToken: string };
    }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name },
      requiresAuth: false,
    }),

  login: (email: string, password: string) =>
    api.request<{
      user: { id: string; email: string; name: string; photoUrl?: string; provider: string };
      tokens: { accessToken: string; refreshToken: string };
    }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      requiresAuth: false,
    }),

  logout: (refreshToken?: string) =>
    api.request('/api/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    }),

  forgotPassword: (email: string) =>
    api.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
      requiresAuth: false,
    }),

  resetPassword: (token: string, password: string) =>
    api.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      requiresAuth: false,
    }),

  verifyResetToken: (token: string) =>
    api.request<{ valid: boolean }>(`/api/auth/verify-token?token=${token}`, {
      requiresAuth: false,
    }),
};

// User API
export const userApi = {
  getProfile: () =>
    api.request<{ user: { id: string; email: string; name: string; photoUrl?: string; provider: string } }>(
      '/api/user/profile'
    ),

  updateProfile: (data: { name?: string; photoUrl?: string }) =>
    api.request<{ user: { id: string; email: string; name: string; photoUrl?: string; provider: string } }>(
      '/api/user/profile',
      { method: 'PUT', body: data }
    ),

  deleteAccount: () => api.request('/api/user/account', { method: 'DELETE' }),
};

// Sync API
export const syncApi = {
  getData: () =>
    api.request<{
      goals: Array<{
        id: string;
        title: string;
        note: string;
        importance: 'low' | 'med' | 'high';
        northStar: string;
        whyItMatters: string;
        createdAt: number;
      }>;
      checkIns: Array<{
        id: string;
        type: 'goal' | 'identity';
        goalId: string | null;
        date: number;
        response: 'yes' | 'somewhat' | 'no';
        reflection: string;
      }>;
      signals: Array<{
        id: string;
        text: string;
        timestamp: number;
        type: 'inquiry' | 'manifesto' | 'insight';
        feedback: 'like' | 'dislike' | 'none';
        targetType: 'goal' | 'identity';
        targetIdentity?: string;
      }>;
      settings: {
        notificationFrequency: 2 | 3 | 7;
        notificationTone: 'gentle' | 'direct' | 'motivational';
        notificationTime: string;
        notificationDays: string[];
        hasOnboarded: boolean;
        mainMission?: string;
        currentGoalIndex: number;
      };
    }>('/api/sync'),

  syncData: (data: {
    goals?: Array<{
      id: string;
      title: string;
      note: string;
      importance: 'low' | 'med' | 'high';
      northStar: string;
      whyItMatters: string;
      createdAt: number;
    }>;
    checkIns?: Array<{
      id: string;
      type: 'goal' | 'identity';
      goalId: string | null;
      date: number;
      response: 'yes' | 'somewhat' | 'no';
      reflection: string;
    }>;
    signals?: Array<{
      id: string;
      text: string;
      timestamp: number;
      type: 'inquiry' | 'manifesto' | 'insight';
      feedback: 'like' | 'dislike' | 'none';
      targetType: 'goal' | 'identity';
      targetIdentity?: string;
    }>;
    settings?: {
      notificationFrequency?: 2 | 3 | 7;
      notificationTone?: 'gentle' | 'direct' | 'motivational';
      notificationTime?: string;
      notificationDays?: string[];
      hasOnboarded?: boolean;
    };
    mainMission?: string;
    currentGoalIndex?: number;
  }) => api.request('/api/sync', { method: 'POST', body: data }),
};
