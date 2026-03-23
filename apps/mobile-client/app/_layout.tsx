import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Animated, { FadeIn, FadeOut, ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { ToastProvider } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import { colors, typography } from '../theme/colors';
import {
  registerForPushNotifications,
  sendPushTokenToServer,
  setupNotificationChannel,
} from '../services/notifications';
import '../locales';

// Prevent the native splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
});

function SplashOverlay() {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(500)}
      style={splashStyles.container}
    >
      {/* Full logo — the B icon + "Bellu" text are part of the image */}
      <Animated.View entering={FadeIn.delay(100).duration(600)} style={splashStyles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={splashStyles.logo}
          contentFit="contain"
        />
      </Animated.View>

      {/* Tagline below the logo */}
      <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={splashStyles.subtitle}>
        Beleza & Estética
      </Animated.Text>

      {/* Subtle loading indicator */}
      <Animated.View entering={FadeIn.delay(600).duration(400)} style={splashStyles.loader}>
        <View style={splashStyles.loaderTrack}>
          <Animated.View
            entering={FadeIn.delay(700).duration(300)}
            style={splashStyles.loaderBar}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 180,
    height: 220,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  loader: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loaderTrack: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  loaderBar: {
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [appReady, setAppReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);
  const pushRegistered = useRef(false);

  // Register push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && !pushRegistered.current) {
      pushRegistered.current = true;
      try {
        setupNotificationChannel();
        registerForPushNotifications().then((token) => {
          if (token) sendPushTokenToServer(token);
        }).catch(() => {});
      } catch (e) {
        console.warn('[Push] Setup failed:', e);
      }
    }
    if (!isAuthenticated) {
      pushRegistered.current = false;
    }
  }, [isAuthenticated]);

  // Handle notification tap — navigate to relevant screen
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.bookingId) {
        router.push(`/(tabs)/bookings`);
      } else if (data?.professionalId) {
        router.push(`/(tabs)/explore`);
      }
    });
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSplash = segments[0] === 'splash';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup && !inSplash && !inOnboarding) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }

    // App is ready — hide native splash, show animated splash briefly
    if (!appReady) {
      setAppReady(true);
      SplashScreen.hideAsync();
      // Show animated splash for a short moment, then hide
      setTimeout(() => setShowAnimatedSplash(false), 1200);
    }
  }, [isAuthenticated, isLoading, segments]);

  return (
    <>
      {children}
      {showAnimatedSplash && <SplashOverlay />}
    </>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#FAF7F5' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#c00', marginBottom: 10 }}>
            App Error
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={{ fontSize: 13, color: '#333' }}>
              {this.state.error.message}
            </Text>
            <Text style={{ fontSize: 11, color: '#666', marginTop: 10 }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <StatusBar style="dark" />
          <AuthGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#FAF7F5' },
                animation: 'slide_from_right',
              }}
            />
          </AuthGuard>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
