import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import messaging from '@react-native-firebase/messaging';
import { useAuthStore } from '../stores/authStore';

const DEFAULT_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_API_HOST}:3333/api`;

// Configure how notifications appear when the app is in the foreground
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('[Notifications] Failed to set handler:', e);
}

/**
 * Register for push notifications and return the FCM token.
 * Uses @react-native-firebase/messaging for direct FCM integration.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  // Request notification permissions via Firebase
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Also request via expo-notifications (for local notification display)
  await Notifications.requestPermissionsAsync();

  try {
    // Get the FCM registration token (works on both iOS and Android)
    // On iOS, Firebase automatically maps the APNs token to an FCM token
    const fcmToken = await messaging().getToken();
    console.log('[Notifications] FCM token:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('[Notifications] Failed to get FCM token:', error);
    return null;
  }
}

/**
 * Send push token to the API server.
 */
export async function sendPushTokenToServer(token: string): Promise<void> {
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.accessToken) return;

  try {
    await fetch(`${API_BASE_URL}/notifications/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });
    console.log('[Notifications] FCM token registered on server');
  } catch (error) {
    console.error('[Notifications] Failed to register token on server:', error);
  }
}

/**
 * Unregister push token from server (on logout).
 */
export async function removePushTokenFromServer(token: string): Promise<void> {
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.accessToken) return;

  try {
    await fetch(`${API_BASE_URL}/notifications/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
  } catch {
    // ignore
  }
}

/**
 * Set up Android notification channel.
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Bellu',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4918E',
      sound: 'default',
    });
  }
}

/**
 * Listen for FCM token refresh and re-register on server.
 */
export function onTokenRefresh(callback: (token: string) => void) {
  return messaging().onTokenRefresh(callback);
}

/**
 * Listen for FCM messages when app is in foreground.
 */
export function onForegroundMessage() {
  return messaging().onMessage(async (remoteMessage) => {
    // Display as local notification via expo-notifications
    if (remoteMessage.notification) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title || '',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data as Record<string, string>,
          sound: 'default',
        },
        trigger: null as unknown as Notifications.NotificationTriggerInput,
      });
    }
  });
}
