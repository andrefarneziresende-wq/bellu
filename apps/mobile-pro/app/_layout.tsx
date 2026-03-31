import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import {
  registerForPushNotifications,
  sendPushTokenToServer,
  setupNotificationChannel,
} from '../services/notifications';
import '../locales';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

function PushNotificationSetup() {
  const token = useAuthStore((s) => s.token);
  const registered = useRef(false);

  useEffect(() => {
    if (!token || registered.current) return;
    registered.current = true;

    (async () => {
      await setupNotificationChannel();
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await sendPushTokenToServer(pushToken);
      }
    })();
  }, [token]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <PushNotificationSetup />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FAF7F5' },
            animation: 'slide_from_right',
          }}
        />
        <ToastProvider />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
