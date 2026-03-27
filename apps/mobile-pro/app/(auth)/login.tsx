import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { colors, spacing, radii } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);
  const [defaultCountryId, setDefaultCountryId] = useState<string | null>(null);
  const { login, isLoading } = useAuthStore();

  const extra = Constants.expoConfig?.extra ?? {};
  const googleIosClientId = extra.googleIosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = extra.googleAndroidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleWebClientId = extra.googleWebClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleConfigured = !!(googleIosClientId || googleAndroidClientId || googleWebClientId);

  const [_googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    googleConfigured
      ? {
          iosClientId: googleIosClientId,
          androidClientId: googleAndroidClientId,
          webClientId: googleWebClientId,
        }
      : { clientId: 'placeholder' }
  );

  // Fetch default country on mount
  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const res = await api.get<{ data: { id: string }[] }>('/countries');
        const list = res.data;
        if (Array.isArray(list) && list.length > 0) {
          setDefaultCountryId(list[0].id);
        }
      } catch {
        // Silently fail
      }
    };
    fetchCountry();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (!googleConfigured || !googleResponse) return;
    if (googleResponse.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setSocialLoading(false);
        toast.error(t('auth.loginError'));
      }
    } else if (googleResponse.type === 'error') {
      setSocialLoading(false);
      toast.error(t('auth.loginError'));
    } else if (googleResponse.type === 'dismiss') {
      setSocialLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const response = await api.post<{
        data: { tokens: { accessToken: string; refreshToken: string } };
      }>('/auth/google', {
        idToken,
        countryId: defaultCountryId ?? '',
        locale: i18n.language,
        role: 'professional',
      });
      const { tokens } = response.data;
      await useAuthStore.getState().loginWithToken(tokens.accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('Network') || msg.includes('fetch')) {
        toast.error(t('errors.network'));
      } else {
        toast.error(t('auth.loginError'));
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      toast.error('Google Sign-In not configured');
      return;
    }
    setSocialLoading(true);
    try {
      await googlePromptAsync();
    } catch {
      setSocialLoading(false);
      toast.error(t('auth.loginError'));
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS !== 'ios') return;

    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      toast.error('Apple Sign-In is not available on this device');
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
        toast.error(t('auth.loginError'));
        setSocialLoading(false);
        return;
      }

      const response = await api.post<{
        data: { tokens: { accessToken: string; refreshToken: string } };
      }>('/auth/apple', {
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
        role: 'professional',
      });

      const { tokens } = response.data;
      await useAuthStore.getState().loginWithToken(tokens.accessToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        // User cancelled — do nothing
      } else {
        const msg = error?.message || '';
        if (msg.includes('Network') || msg.includes('fetch')) {
          toast.error(t('errors.network'));
        } else {
          toast.error(t('auth.loginError'));
        }
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error(t('auth.fillAllFields'));
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      toast.error(error?.message || t('auth.loginError'));
    }
  };

  const busy = isLoading || socialLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={32} color={colors.white} />
          </View>
          <Text style={styles.appName}>Beauty Pro</Text>
          <Text style={styles.title}>{t('auth.proLoginSubtitle')}</Text>
        </Animated.View>

        {/* Social Login */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.socialSection}>
          <Pressable
            style={[styles.socialBtn, busy && styles.socialBtnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={busy}
          >
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={styles.socialBtnText}>{t('auth.continueWithGoogle')}</Text>
          </Pressable>
          {Platform.OS === 'ios' && (
            <Pressable
              style={[styles.socialBtn, busy && styles.socialBtnDisabled]}
              onPress={handleAppleSignIn}
              disabled={busy}
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

        {/* Email/Password Form */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
          <Input placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />
          <Pressable><Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text></Pressable>
          {busy ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <Button title={t('auth.login')} onPress={handleLogin} />
          )}
        </Animated.View>

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
  logoSection: { alignItems: 'center', paddingTop: 60, paddingBottom: spacing.lg },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 32, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  title: { fontSize: 18, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  socialSection: { gap: spacing.md },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { fontSize: 15, fontWeight: '500', color: colors.text },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { paddingHorizontal: spacing.md, fontSize: 13, color: colors.textSecondary },
  form: { gap: spacing.md },
  forgotText: { fontSize: 14, color: colors.primary, fontWeight: '500', alignSelf: 'flex-end' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  signupText: { fontSize: 14, color: colors.textSecondary },
  signupLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
