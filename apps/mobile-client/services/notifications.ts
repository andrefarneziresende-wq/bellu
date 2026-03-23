import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
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
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device');
    return null;
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  // Get the FCM token (works for both iOS and Android via Expo)
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // We actually want the device push token for FCM
    const deviceToken = await Notifications.getDevicePushTokenAsync();

    console.log('[Notifications] Device push token:', deviceToken.data);
    return deviceToken.data as string;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);

    // Fallback to Expo push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      console.log('[Notifications] Expo push token:', token.data);
      return token.data;
    } catch {
      console.error('[Notifications] Failed to get any push token');
      return null;
    }
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
    console.log('[Notifications] Push token registered on server');
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
