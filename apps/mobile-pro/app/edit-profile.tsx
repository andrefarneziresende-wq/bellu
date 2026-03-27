import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors, spacing, radii } from '../theme/colors';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';

interface ProfessionalProfile {
  id: string;
  businessName: string;
  description: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  avatarPhoto: string | null;
}

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get<{ success: boolean; data: ProfessionalProfile }>('/professionals/me');
        const p = res.data;
        setProfile(p);
        setBusinessName(p.businessName || '');
        setDescription(p.description || '');
        setAddress(p.address || '');
        setCity(p.city || '');
        setState(p.state || '');
        setPhone(p.phone || user?.phone || '');
      } catch {
        Alert.alert(t('common.error', 'Erro'), t('editProfile.loadError', 'Não foi possível carregar o perfil.'));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert(t('common.error', 'Erro'), t('pro.editProfile.nameRequired', 'Nome do estabelecimento é obrigatório.'));
      return;
    }
    setSaving(true);
    try {
      await api.patch('/professionals/me', {
        businessName: businessName.trim(),
        description: description.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
      });
      Alert.alert(t('common.save', 'Salvo'), t('editProfile.saved', 'Perfil atualizado com sucesso!'));
      router.back();
    } catch {
      Alert.alert(t('common.error', 'Erro'), t('editProfile.saveError', 'Não foi possível salvar.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('editProfile.title', 'Editar perfil')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        {profile?.avatarPhoto && (
          <View style={styles.avatarContainer}>
            <Image source={{ uri: profile.avatarPhoto }} style={styles.avatar} contentFit="cover" />
          </View>
        )}

        <Text style={styles.fieldLabel}>{t('auth.businessNamePlaceholder', 'Nome do estabelecimento')}</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder={t('auth.businessNamePlaceholder')} placeholderTextColor={colors.textSecondary} />

        <Text style={styles.fieldLabel}>{t('pro.editProfile.description', 'Descrição')}</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder={t('pro.editProfile.descriptionPlaceholder', 'Descreva seu negócio...')} placeholderTextColor={colors.textSecondary} multiline numberOfLines={4} textAlignVertical="top" />

        <Text style={styles.fieldLabel}>{t('auth.addressPlaceholder', 'Endereço')}</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('auth.addressPlaceholder')} placeholderTextColor={colors.textSecondary} />

        <Text style={styles.fieldLabel}>{t('auth.cityPlaceholder', 'Cidade')}</Text>
        <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder={t('auth.cityPlaceholder')} placeholderTextColor={colors.textSecondary} />

        <Text style={styles.fieldLabel}>{t('auth.selectState', 'Estado')}</Text>
        <TextInput style={styles.input} value={state} onChangeText={setState} placeholder={t('auth.selectState')} placeholderTextColor={colors.textSecondary} />

        <Text style={styles.fieldLabel}>{t('editProfile.phone', 'Telefone')}</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder={t('editProfile.phonePlaceholder')} placeholderTextColor={colors.textSecondary} keyboardType="phone-pad" />

        <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>{t('editProfile.save', 'Salvar alterações')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  form: { padding: spacing.lg, paddingBottom: 100 },
  avatarContainer: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { height: 100, paddingTop: spacing.md },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: spacing.md,
    alignItems: 'center', marginTop: spacing.xxl,
  },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
