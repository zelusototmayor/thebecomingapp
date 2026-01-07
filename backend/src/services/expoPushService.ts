import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

interface PushNotificationData extends Record<string, unknown> {
  type: string;
  signalId: string;
  text: string;
  signalType: string;
  targetType: string;
  targetIdentity?: string;
  timestamp: number;
}

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: PushNotificationData
): Promise<boolean> {
  // Validate push token
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return false;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data: data as Record<string, unknown>,
    priority: 'high',
  };

  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    const ticket = ticketChunk[0];

    if (ticket.status === 'error') {
      console.error(`Error sending push notification: ${ticket.message}`);
      return false;
    }

    console.log(`Push notification sent successfully: ${ticket.id}`);
    return true;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

export async function sendPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushTicket[]> {
  // Filter out invalid tokens
  const validMessages = messages.filter((msg) =>
    Expo.isExpoPushToken(msg.to as string)
  );

  if (validMessages.length === 0) {
    console.warn('No valid push tokens provided');
    return [];
  }

  try {
    // Chunk messages according to Expo's limits (100 per chunk)
    const chunks = expo.chunkPushNotifications(validMessages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Failed to send push notifications:', error);
    return [];
  }
}
