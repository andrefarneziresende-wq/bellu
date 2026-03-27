import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radii, typography } from '../theme/colors';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('settings_notifications').then((v) => {
      if (v !== null) setNotificationsEnabled(v === 'true');
    });
    AsyncStorage.getItem('settings_location').then((v) => {
      if (v !== null) setLocationEnabled(v === 'true');
    });
  }, []);

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    AsyncStorage.setItem('settings_notifications', String(val));
  };

  const toggleLocation = (val: boolean) => {
    setLocationEnabled(val);
    AsyncStorage.setItem('settings_location', String(val));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.notifications')}</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            value={notificationsEnabled}
            onValueChange={toggleNotifications}
          />
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>{t('settings.location')}</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            value={locationEnabled}
            onValueChange={toggleLocation}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={styles.row} onPress={() => router.push('/language')}>
          <Ionicons name="language-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.language')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push('/legal')}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.termsOfUse')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
        <Pressable style={styles.row} onPress={() => router.push('/legal')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.privacyPolicy')}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
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
  headerTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.text },
  section: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radii.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md,
  },
  rowLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
});
