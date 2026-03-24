import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/colors';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3333/api';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast(t('editProfile.nameRequired'), 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error' }));
        throw new Error(err.message || 'Failed to update');
      }

      const data = await res.json();
      if (data.data) {
        setUser(data.data);
      }
      toast(t('editProfile.saved'), 'success');
      router.back();
    } catch (error: any) {
      toast(error.message || t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar */}
          <Animated.View entering={FadeInDown.delay(50)} style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('editProfile.name')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('editProfile.namePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('editProfile.email')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('editProfile.emailPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('editProfile.phone')}</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('editProfile.phonePlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.saveSection}>
            {saving ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <Button label={t('editProfile.save')} onPress={handleSave} />
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  form: { gap: spacing.lg },
  field: { gap: spacing.xs },
  label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text, marginLeft: spacing.xs },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radii.lg, paddingHorizontal: spacing.lg, height: 52, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  saveSection: { marginTop: spacing.xxl },
});
