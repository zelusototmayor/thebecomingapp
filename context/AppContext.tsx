import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { AppState, Goal, CheckIn, Settings, User, Signal, DEFAULT_APP_STATE, DEFAULT_SETTINGS } from '../types';
import { loadAppState, saveAppState, clearAppState, generateId } from '../lib/storage';
import { generateEvolutionSignal } from '../lib/ai';
import { syncApi } from '../lib/api';
import { getTokens, clearTokens, isAuthenticated } from '../lib/auth';
import { registerPushTokenWithBackend, unregisterPushTokenFromBackend } from '../lib/notifications';

interface AppContextType {
  state: AppState;
  isLoading: boolean;
  isGeneratingSignal: boolean;
  isSyncing: boolean;
  isOnline: boolean;

  // Auth actions
  handleLogin: (user: User) => void;
  handleLogout: () => Promise<void>;

  // Sync
  syncData: () => Promise<void>;

  // Onboarding
  setOnboarded: (goals: Goal[], settings: Settings, mainMission: string) => void;

  // Goals
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setCurrentGoalIndex: (index: number) => void;

  // Check-ins
  addCheckIn: (checkIn: CheckIn) => void;

  // Settings
  updateSettings: (settings: Settings) => void;

  // Signals
  addSignal: (signal: Signal) => void;
  triggerSignal: () => Promise<void>;
  updateSignalFeedback: (id: string, feedback: 'like' | 'dislike') => void;
  createSignalFromNotification: (notificationData: Record<string, unknown>) => void;

  // Data management
  resetAllData: () => Promise<void>;
  migrateLocalData: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialSync = useRef(false);

  // Load state on mount
  useEffect(() => {
    const initializeApp = async () => {
      // First load local state
      const localState = await loadAppState();
      setState(localState);

      // Check if user is authenticated and sync from server
      const authenticated = await isAuthenticated();
      if (authenticated && !hasInitialSync.current) {
        hasInitialSync.current = true;
        try {
          const serverData = await syncApi.getData();
          setState((prev) => ({
            ...prev,
            goals: serverData.goals,
            checkIns: serverData.checkIns,
            signals: serverData.signals,
            mainMission: serverData.settings.mainMission || '',
            currentGoalIndex: serverData.settings.currentGoalIndex || 0,
            settings: {
              notificationFrequency: serverData.settings.notificationFrequency,
              notificationTone: serverData.settings.notificationTone,
              notificationTime: serverData.settings.notificationTime,
              notificationDays: serverData.settings.notificationDays,
              hasOnboarded: serverData.settings.hasOnboarded,
            },
          }));
        } catch (error) {
          // Silent fail - user may not be logged in yet, which is expected
        }
      }

      setIsLoading(false);
    };

    initializeApp();
  }, []);

  // Save state locally on change
  useEffect(() => {
    if (!isLoading) {
      saveAppState(state);
    }
  }, [state, isLoading]);

  // Debounced sync to server
  const debouncedSync = useCallback(async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated || !state.user) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncApi.syncData({
          goals: state.goals,
          checkIns: state.checkIns,
          signals: state.signals,
          settings: {
            notificationFrequency: state.settings.notificationFrequency,
            notificationTone: state.settings.notificationTone,
            notificationTime: state.settings.notificationTime,
            notificationDays: state.settings.notificationDays,
            hasOnboarded: state.settings.hasOnboarded,
          },
          mainMission: state.mainMission,
          currentGoalIndex: state.currentGoalIndex,
        });
      } catch (error) {
        console.log('Background sync failed:', error);
      }
    }, 2000); // Debounce 2 seconds
  }, [state]);

  // Sync data changes to server (debounced)
  useEffect(() => {
    if (!isLoading && state.user) {
      debouncedSync();
    }
  }, [state.goals, state.checkIns, state.signals, state.settings, state.mainMission, state.currentGoalIndex, isLoading, debouncedSync]);

  // Manual sync
  const syncData = useCallback(async () => {
    const authenticated = await isAuthenticated();
    if (!authenticated) return;

    setIsSyncing(true);
    try {
      const serverData = await syncApi.getData();
      setState((prev) => ({
        ...prev,
        goals: serverData.goals,
        checkIns: serverData.checkIns,
        signals: serverData.signals,
        mainMission: serverData.settings.mainMission || '',
        currentGoalIndex: serverData.settings.currentGoalIndex || 0,
        settings: {
          notificationFrequency: serverData.settings.notificationFrequency,
          notificationTone: serverData.settings.notificationTone,
          notificationTime: serverData.settings.notificationTime,
          notificationDays: serverData.settings.notificationDays,
          hasOnboarded: serverData.settings.hasOnboarded,
        },
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Migrate local data to server (for new users with existing local data)
  const migrateLocalData = useCallback(async (): Promise<boolean> => {
    const authenticated = await isAuthenticated();
    if (!authenticated) return false;

    const localState = await loadAppState();

    // Check if there's local data to migrate
    if (localState.goals.length === 0 && localState.checkIns.length === 0 && localState.signals.length === 0) {
      return false; // No data to migrate
    }

    setIsSyncing(true);
    try {
      await syncApi.syncData({
        goals: localState.goals,
        checkIns: localState.checkIns,
        signals: localState.signals,
        settings: {
          notificationFrequency: localState.settings.notificationFrequency,
          notificationTone: localState.settings.notificationTone,
          notificationTime: localState.settings.notificationTime,
          notificationDays: localState.settings.notificationDays,
          hasOnboarded: localState.settings.hasOnboarded,
        },
        mainMission: localState.mainMission,
        currentGoalIndex: localState.currentGoalIndex,
      });

      // Refresh state from server after migration
      await syncData();
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [syncData]);

  // Auth actions
  const handleLogin = useCallback((user: User) => {
    setState((prev) => ({ ...prev, user }));
    hasInitialSync.current = false; // Reset so we sync on next load

    // Register push token with backend for scheduled notifications
    registerPushTokenWithBackend();
  }, []);

  const handleLogout = useCallback(async () => {
    // Unregister push token from backend
    await unregisterPushTokenFromBackend();

    await clearTokens();
    setState((prev) => ({ ...prev, user: null }));
    hasInitialSync.current = false;
  }, []);

  // Onboarding
  const setOnboarded = useCallback((goals: Goal[], settings: Settings, mainMission: string) => {
    setState((prev) => ({
      ...prev,
      goals,
      mainMission,
      settings: { ...settings, hasOnboarded: true },
    }));
  }, []);

  // Goals
  const addGoal = useCallback((goal: Goal) => {
    setState((prev) => ({ ...prev, goals: [...prev.goals, goal] }));
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
      currentGoalIndex: 0,
    }));
  }, []);

  const setCurrentGoalIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentGoalIndex: index }));
  }, []);

  // Check-ins
  const addCheckIn = useCallback((checkIn: CheckIn) => {
    setState((prev) => ({
      ...prev,
      checkIns: [checkIn, ...prev.checkIns],
    }));
  }, []);

  // Settings
  const updateSettings = useCallback((settings: Settings) => {
    setState((prev) => ({ ...prev, settings }));
  }, []);

  // Signals
  const addSignal = useCallback((signal: Signal) => {
    setState((prev) => ({
      ...prev,
      signals: [signal, ...prev.signals],
    }));
  }, []);

  const triggerSignal = useCallback(async () => {
    if (state.goals.length === 0 && !state.mainMission) return;

    setIsGeneratingSignal(true);
    try {
      const signalData = await generateEvolutionSignal(
        state.goals,
        state.mainMission,
        state.settings.notificationTone,
        state.signals
      );

      const newSignal: Signal = {
        id: generateId(),
        text: signalData.text,
        type: signalData.type,
        timestamp: Date.now(),
        feedback: 'none',
        targetType: signalData.targetType,
        targetIdentity: signalData.targetIdentity,
      };

      setState((prev) => ({
        ...prev,
        signals: [newSignal, ...prev.signals],
      }));
    } catch (error) {
      console.error('Error generating signal:', error);
    } finally {
      setIsGeneratingSignal(false);
    }
  }, [state.goals, state.mainMission, state.settings.notificationTone, state.signals]);

  const updateSignalFeedback = useCallback((id: string, feedback: 'like' | 'dislike') => {
    setState((prev) => ({
      ...prev,
      signals: prev.signals.map((s) =>
        s.id === id ? { ...s, feedback: s.feedback === feedback ? 'none' : feedback } : s
      ),
    }));
  }, []);

  const createSignalFromNotification = useCallback((notificationData: Record<string, unknown>) => {
    const type = notificationData.type as string;

    // Only create signal for scheduled notifications, not triggered ones (they're already created)
    if (type !== 'scheduled_signal') return;

    // Extract signal data from notification
    // Backend push notifications send richer data
    const signalId = (notificationData.signalId as string) || generateId();
    const text = (notificationData.text as string) || (notificationData.message as string) || 'Evolution signal received';
    const signalType = (notificationData.signalType as Signal['type']) || 'inquiry';
    const targetType = (notificationData.targetType as Signal['targetType']) || 'identity';
    const targetIdentity = notificationData.targetIdentity as string | undefined;
    const timestamp = (notificationData.timestamp as number) || Date.now();

    // Check if a signal with this ID already exists (avoid duplicates)
    const exists = state.signals.some((s) => s.id === signalId);

    if (exists) {
      console.log('Signal already exists, skipping duplicate');
      return;
    }

    // Create signal from notification data
    const newSignal: Signal = {
      id: signalId,
      text,
      timestamp,
      type: signalType,
      feedback: 'none',
      targetType,
      targetIdentity: targetIdentity || undefined,
    };

    setState((prev) => ({
      ...prev,
      signals: [newSignal, ...prev.signals],
    }));

    console.log('Signal created from push notification:', signalId);
  }, [state.signals]);

  // Data management
  const resetAllData = useCallback(async () => {
    await clearAppState();
    await clearTokens();
    setState(DEFAULT_APP_STATE);
    hasInitialSync.current = false;
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        isLoading,
        isGeneratingSignal,
        isSyncing,
        isOnline,
        handleLogin,
        handleLogout,
        syncData,
        setOnboarded,
        addGoal,
        updateGoal,
        deleteGoal,
        setCurrentGoalIndex,
        addCheckIn,
        updateSettings,
        addSignal,
        triggerSignal,
        updateSignalFeedback,
        createSignalFromNotification,
        resetAllData,
        migrateLocalData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
