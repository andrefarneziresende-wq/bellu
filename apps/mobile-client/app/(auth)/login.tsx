import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.login'), t('auth.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      const { user, tokens } = response.data;
      useAuthStore.getState().login(user, tokens);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(t('auth.login'), error.message || t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={32} color={colors.white} />
          </View>
          <Text style={styles.appName}>Beauty</Text>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </Animated.View>

        {/* Social Login */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.socialSection}>
          <Pressable style={styles.socialBtn}>
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={styles.socialBtnText}>{t('auth.continueWithGoogle')}</Text>
          </Pressable>
          <Pressable style={styles.socialBtn}>
            <Ionicons name="logo-apple" size={20} color={colors.text} />
            <Text style={styles.socialBtnText}>{t('auth.continueWithApple')}</Text>
          </Pressable>
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
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </Pressable>
          {loading ? (
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
  logoSection: { alignItems: 'center', paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  appName: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: colors.text },
  title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
  socialSection: { gap: spacing.md },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
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
