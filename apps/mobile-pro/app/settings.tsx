import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('pro_notifications_enabled').then((v) => {
      if (v !== null) setNotificationsEnabled(v === 'true');
    });
  }, []);

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('pro_notifications_enabled', String(value));
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout', 'Sair'), t('profile.logoutConfirm', 'Tem certeza que deseja sair?'), [
      { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
      { text: t('common.yes', 'Sim'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.settings', 'Configurações')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          <Text style={styles.label}>{t('settings.notifications', 'Notificações')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        <Pressable style={styles.row} onPress={() => router.push('/language' as any)}>
          <Ionicons name="language-outline" size={22} color={colors.text} />
          <Text style={styles.label}>{t('profile.language', 'Idioma')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.row} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={[styles.label, { color: colors.error }]}>{t('profile.logout', 'Sair')}</Text>
        </Pressable>
      </View>

      <Text style={styles.version}>{t('settings.version', 'Versão')} 1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  section: {
    backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    borderRadius: radii.xl, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md,
  },
  label: { flex: 1, fontSize: 16, color: colors.text },
  version: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: spacing.xxl },
});
