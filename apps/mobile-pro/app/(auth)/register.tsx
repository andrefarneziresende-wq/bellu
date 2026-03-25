import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { colors, spacing, radii } from '../../theme/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../services/api';

const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre', timezone: 'America/Rio_Branco' },
  { uf: 'AL', name: 'Alagoas', timezone: 'America/Sao_Paulo' },
  { uf: 'AM', name: 'Amazonas', timezone: 'America/Manaus' },
  { uf: 'AP', name: 'Amapá', timezone: 'America/Manaus' },
  { uf: 'BA', name: 'Bahia', timezone: 'America/Sao_Paulo' },
  { uf: 'CE', name: 'Ceará', timezone: 'America/Sao_Paulo' },
  { uf: 'DF', name: 'Distrito Federal', timezone: 'America/Sao_Paulo' },
  { uf: 'ES', name: 'Espírito Santo', timezone: 'America/Sao_Paulo' },
  { uf: 'GO', name: 'Goiás', timezone: 'America/Sao_Paulo' },
  { uf: 'MA', name: 'Maranhão', timezone: 'America/Sao_Paulo' },
  { uf: 'MG', name: 'Minas Gerais', timezone: 'America/Sao_Paulo' },
  { uf: 'MS', name: 'Mato Grosso do Sul', timezone: 'America/Cuiaba' },
  { uf: 'MT', name: 'Mato Grosso', timezone: 'America/Cuiaba' },
  { uf: 'PA', name: 'Pará', timezone: 'America/Manaus' },
  { uf: 'PB', name: 'Paraíba', timezone: 'America/Sao_Paulo' },
  { uf: 'PE', name: 'Pernambuco', timezone: 'America/Sao_Paulo' },
  { uf: 'PI', name: 'Piauí', timezone: 'America/Sao_Paulo' },
  { uf: 'PR', name: 'Paraná', timezone: 'America/Sao_Paulo' },
  { uf: 'RJ', name: 'Rio de Janeiro', timezone: 'America/Sao_Paulo' },
  { uf: 'RN', name: 'Rio Grande do Norte', timezone: 'America/Sao_Paulo' },
  { uf: 'RO', name: 'Rondônia', timezone: 'America/Manaus' },
  { uf: 'RR', name: 'Roraima', timezone: 'America/Manaus' },
  { uf: 'RS', name: 'Rio Grande do Sul', timezone: 'America/Sao_Paulo' },
  { uf: 'SC', name: 'Santa Catarina', timezone: 'America/Sao_Paulo' },
  { uf: 'SE', name: 'Sergipe', timezone: 'America/Sao_Paulo' },
  { uf: 'SP', name: 'São Paulo', timezone: 'America/Sao_Paulo' },
  { uf: 'TO', name: 'Tocantins', timezone: 'America/Sao_Paulo' },
];

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [countryId, setCountryId] = useState('');
  const { register, isLoading } = useAuthStore();

  // Fetch Brazil country ID on mount
  useEffect(() => {
    api.get<{ data: { id: string; code: string }[] }>('/countries')
      .then((res: any) => {
        const list = res.data || res;
        const brazil = (Array.isArray(list) ? list : []).find((c: any) => c.code === 'BR');
        if (brazil) setCountryId(brazil.id);
      })
      .catch(() => {});
  }, []);

  const getTimezone = (uf: string) => {
    return BRAZILIAN_STATES.find((s) => s.uf === uf)?.timezone || 'America/Sao_Paulo';
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    if (!businessName.trim()) {
      toast.error(t('auth.businessNameRequired', 'Informe o nome do estabelecimento'));
      return;
    }
    if (!selectedState) {
      toast.error(t('auth.stateRequired', 'Selecione o estado'));
      return;
    }
    if (!city.trim()) {
      toast.error(t('auth.cityRequired', 'Informe a cidade'));
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
        address: address.trim(),
        city: city.trim(),
        state: selectedState,
        timezone: getTimezone(selectedState),
        countryId,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      toast.error(error?.message || t('auth.registerError'));
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
          <Text style={styles.sectionLabel}>{t('auth.personalInfo', 'Dados pessoais')}</Text>
          <Input placeholder={t('auth.namePlaceholder')} value={name} onChangeText={setName} />
          <Input placeholder={t('auth.emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input placeholder={t('auth.phonePlaceholder')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input placeholder={t('auth.passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry />

          <Text style={styles.sectionLabel}>{t('auth.businessInfo', 'Dados do estabelecimento')}</Text>
          <Input placeholder={t('auth.businessNamePlaceholder', 'Nome do estabelecimento')} value={businessName} onChangeText={setBusinessName} />
          <Input placeholder="CPF/CNPJ" value={taxId} onChangeText={setTaxId} keyboardType="numeric" />
          <Input placeholder={t('auth.addressPlaceholder', 'Endereço')} value={address} onChangeText={setAddress} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input placeholder={t('auth.cityPlaceholder', 'Cidade')} value={city} onChangeText={setCity} />
            </View>
            <View style={styles.halfField}>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedState}
                  onValueChange={setSelectedState}
                  style={styles.picker}
                >
                  <Picker.Item label={t('auth.selectState', 'Estado (UF)')} value="" color={colors.textSecondary} />
                  {BRAZILIAN_STATES.map((s) => (
                    <Picker.Item key={s.uf} label={`${s.uf} - ${s.name}`} value={s.uf} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.countryRow}>
            <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.countryText}>{t('auth.country', 'País')}: Brasil 🇧🇷</Text>
          </View>

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
  scroll: { paddingHorizontal: spacing.xxl, paddingBottom: 40 },
  header: { paddingTop: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, paddingTop: spacing.xl },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl },
  form: { gap: spacing.md },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfField: { flex: 1 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  picker: { height: 50, color: colors.text },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.xs },
  countryText: { fontSize: 13, color: colors.textSecondary },
  terms: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, marginTop: spacing.sm },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xxl, paddingBottom: spacing.xxxl },
  loginText: { fontSize: 14, color: colors.textSecondary },
  loginLink: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
