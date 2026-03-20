import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert(t('common.error'), t('auth.fillAllFields'));
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        specialties: [],
        businessName: businessName.trim(),
        taxId: taxId.trim(),
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error?.message || t('auth.registerError'),
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.title}>{t('auth.signupTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
          <Input placeholder={t('auth.namePlaceholder')} value={name} onChangeText={setName} />
          <Input placeholder="Nome do estabelecimento" value={businessName} onChangeText={setBusinessName} />
          <Input placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input placeholder={t('auth.phonePlaceholder')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input placeholder="CPF/CNPJ" value={taxId} onChangeText={setTaxId} keyboardType="numeric" />
          <Input placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            <Button label={t('auth.signup')} onPress={handleRegister} />
          )}
          <Text style={styles.terms}>{t('auth.termsAgreement')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.loginRow}>
          <Text style={styles.loginText}>{t('auth.hasAccount')} </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.loginLink}>{t('auth.login')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xxl },
  header: { paddingTop: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, paddingTop: spacing.xl },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
  form: { gap: spacing.md },
  terms: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, paddingBottom: spacing.xxxl },
  loginText: { fontSize: 14, color: colors.textSecondary },
  loginLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
