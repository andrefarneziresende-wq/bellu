import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authApi, countriesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [defaultCountryId, setDefaultCountryId] = useState<string | null>(null);

  const extra = Constants.expoConfig?.extra ?? {};
  const googleIosClientId = extra.googleIosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = extra.googleAndroidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleWebClientId = extra.googleWebClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    webClientId: googleWebClientId,
  });

  // Fetch default country on mount
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await countriesApi.list();
        if (res.data && res.data.length > 0) {
          setDefaultCountryId(res.data[0].id);
        }
      } catch {
        // Silently fail — social sign-in will use empty string
      }
    };
    fetchCountry();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setSocialLoading(false);
        toast(t('auth.loginError'), 'error');
      }
    } else if (googleResponse?.type === 'error') {
      setSocialLoading(false);
      toast(t('auth.loginError'), 'error');
    } else if (googleResponse?.type === 'dismiss') {
      setSocialLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const response = await authApi.googleSignIn({
        idToken,
        countryId: defaultCountryId ?? '',
        locale: i18n.language,
      });
      const { user, tokens } = response.data;
      useAuthStore.getState().login(user, tokens);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Network') || msg.includes('fetch')) {
        toast(t('errors.network'), 'error');
      } else {
        toast(t('auth.loginError'), 'error');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleIosClientId && !googleAndroidClientId && !googleWebClientId) {
      toast('Google Sign-In not configured', 'warning');
      return;
    }
    setSocialLoading(true);
    try {
      await googlePromptAsync();
    } catch {
      setSocialLoading(false);
      toast(t('auth.loginError'), 'error');
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      toast('Apple Sign-In is not available on this device', 'warning');
      return;
    }

    setSocialLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        toast(t('auth.loginError'), 'error');
        setSocialLoading(false);
        return;
      }

      const response = await authApi.appleSignIn({
        identityToken: credential.identityToken,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName ?? undefined,
              familyName: credential.fullName.familyName ?? undefined,
            }
          : undefined,
        email: credential.email ?? undefined,
        countryId: defaultCountryId ?? '',
        locale: i18n.language,
      });

      const { user, tokens } = response.data;
      useAuthStore.getState().login(user, tokens);
      router.replace('/(tabs)');
    } catch (error: any) {
      // Apple sign-in cancelled by user has code ERR_CANCELED
      if (error.code === 'ERR_CANCELED') {
        // User cancelled, do nothing
      } else {
        const msg = error.message || '';
        if (msg.includes('Network') || msg.includes('fetch')) {
          toast(t('errors.network'), 'error');
        } else {
          toast(t('auth.loginError'), 'error');
        }
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast(t('auth.fillAllFields'), 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user, tokens } = response.data;
      useAuthStore.getState().login(user, tokens);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Invalid') || msg.includes('credentials') || msg.includes('not found') || msg.includes('Unauthorized')) {
        toast(t('auth.loginError'), 'error');
      } else if (msg.includes('Network') || msg.includes('fetch')) {
        toast(t('errors.network'), 'error');
      } else {
        toast(t('auth.loginError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || socialLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </Animated.View>

        {/* Social Login */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.socialSection}>
          <Pressable
            style={[styles.socialBtn, isLoading && styles.socialBtnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={styles.socialBtnText}>{t('auth.continueWithGoogle')}</Text>
          </Pressable>
          {Platform.OS === 'ios' && (
            <Pressable
              style={[styles.socialBtn, isLoading && styles.socialBtnDisabled]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-apple" size={20} color={colors.text} />
              <Text style={styles.socialBtnText}>{t('auth.continueWithApple')}</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
          <Input
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Pressable style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </Pressable>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button label={t('auth.login')} onPress={handleLogin} />
          )}
        </Animated.View>

        {/* Sign up link */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.signupRow}>
          <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.signupLink}>{t('auth.signup')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xxl },
  logoSection: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  logo: { width: 120, height: 120, marginBottom: spacing.sm },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  socialSection: { gap: spacing.md },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { paddingHorizontal: spacing.md, fontSize: typography.sizes.sm, color: colors.textSecondary },
  form: { gap: spacing.md },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.medium },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  signupText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  signupLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },
});
