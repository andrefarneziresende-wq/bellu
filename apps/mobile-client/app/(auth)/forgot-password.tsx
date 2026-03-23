import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authApi } from '../../services/api';

type Step = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      toast(t('auth.fillAllFields'), 'warning');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast(t('auth.codeSent'), 'success');
      setStep('reset');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Network') || msg.includes('fetch')) {
        toast(t('errors.network'), 'error');
      } else {
        toast(t('errors.generic'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      toast(t('auth.fillAllFields'), 'warning');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      toast(t('auth.resetSuccess'), 'success');
      router.replace('/(auth)/login');
    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('Network') || msg.includes('fetch')) {
        toast(t('errors.network'), 'error');
      } else {
        toast(t('auth.resetError'), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Back button */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {step === 'request' ? (
          <>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.headerSection}>
              <Ionicons name="lock-closed-outline" size={48} color={colors.primary} />
              <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
              <Input
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Button label={t('auth.sendCode')} onPress={handleSendCode} />
              )}
            </Animated.View>
          </>
        ) : (
          <>
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.headerSection}>
              <Ionicons name="key-outline" size={48} color={colors.primary} />
              <Text style={styles.title}>{t('auth.resetTitle')}</Text>
              <Text style={styles.subtitle}>{t('auth.resetSubtitle')}</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
              <Input
                placeholder={t('auth.codePlaceholder')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Input
                placeholder={t('auth.newPasswordPlaceholder')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              {loading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <Button label={t('auth.resetPassword')} onPress={handleResetPassword} />
              )}
            </Animated.View>

            {/* Resend link */}
            <Animated.View entering={FadeInDown.delay(400)} style={styles.resendRow}>
              <Pressable onPress={() => setStep('request')}>
                <Text style={styles.resendLink}>{t('auth.sendCode')}</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xxl },
  backBtn: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  headerSection: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  form: { gap: spacing.md },
  resendRow: { alignItems: 'center', marginTop: spacing.xl },
  resendLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
