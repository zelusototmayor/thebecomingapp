import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'becoming_access_token';
const REFRESH_TOKEN_KEY = 'becoming_refresh_token';

// Web fallback using localStorage
const webStorage = {
  setItem: (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  getItem: (key: string): string | null => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  deleteItem: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  if (Platform.OS === 'web') {
    webStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    webStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getTokens = async (): Promise<AuthTokens | null> => {
  let accessToken: string | null;
  let refreshToken: string | null;

  if (Platform.OS === 'web') {
    accessToken = webStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = webStorage.getItem(REFRESH_TOKEN_KEY);
  } else {
    accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  }

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken };
};

export const clearTokens = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    webStorage.deleteItem(ACCESS_TOKEN_KEY);
    webStorage.deleteItem(REFRESH_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const tokens = await getTokens();
  return tokens !== null && tokens.accessToken !== null;
};
