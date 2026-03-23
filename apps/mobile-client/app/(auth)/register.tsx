import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import { authApi, countriesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Country } from '@beauty/shared-types';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await countriesApi.list();
        setCountries(response.data);
        const locale = i18n.language;
        const matched = response.data.find((c: Country) => c.locale === locale);
        setSelectedCountry(matched || response.data[0] || null);
      } catch (error: any) {
        toast(error.message || t('errors.loadError'), 'error');
      }
    };
    fetchCountries();
  }, [i18n.language]);

  const handleRegister = async () => {
    if (!name || (!email && !phone) || !password) {
      toast(t('auth.fillAllFields'), 'warning');
      return;
    }

    if (!selectedCountry) {
      toast(t('common.loading'), 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        password,
        countryId: selectedCountry.id,
        locale: selectedCountry.locale,
      });
      const { user, tokens } = response.data;
      useAuthStore.getState().login(user, tokens);
      router.replace('/(tabs)');
    } catch (error: any) {
      toast(error.message || t('auth.registerError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
        </View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleSection}>
          <Text style={styles.title}>{t('auth.signupTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
          <Input
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={setName}
          />
          <Input
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Country selector */}
          {countries.length > 1 && (
            <View style={styles.countryRow}>
              {countries.map((country) => (
                <Pressable
                  key={country.id}
                  style={[
                    styles.countryChip,
                    selectedCountry?.id === country.id && styles.countryChipActive,
                  ]}
                  onPress={() => setSelectedCountry(country)}
                >
                  <Text
                    style={[
                      styles.countryChipText,
                      selectedCountry?.id === country.id && styles.countryChipTextActive,
                    ]}
                  >
                    {country.name} ({country.code})
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button label={t('auth.signup')} onPress={handleRegister} />
          )}

          <Pressable onPress={() => router.push('/legal')}>
            <Text style={styles.terms}>{t('auth.termsAgreement')}</Text>
          </Pressable>
        </Animated.View>

        {/* Login link */}
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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  titleSection: { paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
  subtitle: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  form: { gap: spacing.md },
  countryRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  countryChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  countryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  countryChipText: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  countryChipTextActive: { color: colors.white },
  terms: { fontSize: typography.sizes.xs, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, paddingBottom: spacing.xxxl },
  loginText: { fontSize: typography.sizes.sm, color: colors.textSecondary },
  loginLink: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },
});
