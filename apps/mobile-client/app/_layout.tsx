import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Animated, { FadeIn, FadeOut, ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { ToastProvider } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';
import { colors, typography } from '../theme/colors';
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
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(400)}
      style={splashStyles.container}
    >
      <Animated.View entering={ZoomIn.duration(600)} style={splashStyles.logoWrap}>
        <Image
          source={require('../assets/logo.png')}
          style={splashStyles.logo}
          contentFit="contain"
        />
      </Animated.View>
      <Animated.Text entering={FadeInDown.delay(300).duration(500)} style={splashStyles.title}>
        Bellu
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(500).duration(500)} style={splashStyles.subtitle}>
        Beleza & Estética
      </Animated.Text>
      <Animated.View entering={FadeIn.delay(700).duration(400)} style={splashStyles.dots}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[splashStyles.dot, i === 1 && splashStyles.dotActive]} />
        ))}
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
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: 16,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [appReady, setAppReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

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

export default function RootLayout() {
  return (
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
  );
}
