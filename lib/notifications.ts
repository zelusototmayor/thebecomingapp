import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Settings } from '../types';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Map day abbreviations to iOS weekday numbers (Sunday = 1, Monday = 2, etc.)
const DAY_TO_WEEKDAY: Record<string, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

export interface NotificationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<NotificationPermissionResult> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return { granted: true, canAskAgain: true };
  }

  const { status, canAskAgain } = await Notifications.requestPermissionsAsync();

  return {
    granted: status === 'granted',
    canAskAgain: canAskAgain ?? false,
  };
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Send an immediate local notification (for testing/triggering)
 */
export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: data ?? {},
    },
    trigger: null, // null = immediate
  });

  return notificationId;
}

/**
 * Schedule a notification for a specific time today or next occurrence
 */
export async function scheduleNotificationForTime(
  title: string,
  body: string,
  hour: number,
  minute: number,
  data?: Record<string, unknown>
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return notificationId;
}

/**
 * Schedule recurring notifications based on user settings
 */
export async function scheduleRecurringNotifications(
  settings: Settings,
  notificationBody: string = 'Time for your evolution signal'
): Promise<string[]> {
  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hourStr, minuteStr] = settings.notificationTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const scheduledIds: string[] = [];

  // Schedule a notification for each active day
  for (const day of settings.notificationDays) {
    const weekday = DAY_TO_WEEKDAY[day];
    if (!weekday) continue;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'The Becoming',
          body: notificationBody,
          sound: 'default',
          data: { type: 'scheduled_signal' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      });
      scheduledIds.push(notificationId);
    } catch (error) {
      console.error(`Failed to schedule notification for ${day}:`, error);
    }
  }

  return scheduledIds;
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set up notification response listener (when user taps notification)
 * Returns a cleanup function to remove the listener
 */
export function setupNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;

    // Navigate to signals screen when notification is tapped
    // Use setTimeout to ensure navigation happens after app is ready
    setTimeout(() => {
      router.push('/signals');
    }, 100);
  });

  return () => subscription.remove();
}

/**
 * Set up notification received listener (when notification arrives while app is open)
 * Returns a cleanup function to remove the listener
 */
export function setupNotificationReceivedListener(
  callback?: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    if (callback) {
      callback(notification);
    }
  });

  return () => subscription.remove();
}

/**
 * Initialize notifications - call this on app start
 */
export async function initializeNotifications(): Promise<boolean> {
  // Request permissions
  const { granted } = await requestNotificationPermissions();

  if (!granted) {
    console.log('Notification permissions not granted');
    return false;
  }

  // Set up notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
    });
  }

  return true;
}
