import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/ui/Toast';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="sparkles" size={32} color={colors.white} />
          </View>
          <Text style={styles.appName}>Beauty Pro</Text>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
          <Input placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />
          <Pressable><Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text></Pressable>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <Button label={t('auth.login')} onPress={handleLogin} />
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.signupRow}>
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
  logoSection: { alignItems: 'center', paddingTop: 60, paddingBottom: spacing.xxxl },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  appName: { fontSize: 32, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  title: { fontSize: 18, color: colors.textSecondary, marginTop: spacing.sm },
  form: { gap: spacing.md },
  forgotText: { fontSize: 14, color: colors.primary, fontWeight: '500', alignSelf: 'flex-end' },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl },
  signupText: { fontSize: 14, color: colors.textSecondary },
  signupLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
