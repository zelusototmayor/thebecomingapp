import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, DEFAULT_APP_STATE } from '../types';

const STORAGE_KEY = 'life-compass-state';

// Load entire app state
export async function loadAppState(): Promise<AppState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure signals array exists (migration)
      if (!('signals' in parsed)) {
        parsed.signals = [];
      }
      // Migrate CheckIn records: add type field if missing
      if (parsed.checkIns) {
        parsed.checkIns = parsed.checkIns.map((checkIn: Record<string, unknown>) => ({
          ...checkIn,
          type: checkIn.type || 'goal',
        }));
      }
      // Migrate Signal records: add targetType field if missing
      if (parsed.signals) {
        parsed.signals = parsed.signals.map((signal: Record<string, unknown>) => ({
          ...signal,
          targetType: signal.targetType || 'goal',
        }));
      }
      return { ...DEFAULT_APP_STATE, ...parsed };
    }
    return DEFAULT_APP_STATE;
  } catch (error) {
    console.error('Error loading app state:', error);
    return DEFAULT_APP_STATE;
  }
}

// Save entire app state
export async function saveAppState(state: AppState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving app state:', error);
    throw error;
  }
}

// Clear all data
export async function clearAppState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing app state:', error);
    throw error;
  }
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
