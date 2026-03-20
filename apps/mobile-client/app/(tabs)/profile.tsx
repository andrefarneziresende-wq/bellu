import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const menuItems: { icon: IoniconsName; labelKey: string; route?: string }[] = [
  { icon: 'calendar-outline', labelKey: 'profile.myBookings' },
  { icon: 'heart-outline', labelKey: 'profile.favorites' },
  { icon: 'card-outline', labelKey: 'profile.paymentMethods' },
  { icon: 'notifications-outline', labelKey: 'profile.notifications' },
  { icon: 'settings-outline', labelKey: 'profile.settings' },
  { icon: 'language-outline', labelKey: 'profile.language' },
  { icon: 'help-circle-outline', labelKey: 'profile.helpSupport' },
  { icon: 'document-text-outline', labelKey: 'profile.termsOfUse' },
  { icon: 'shield-checkmark-outline', labelKey: 'profile.privacyPolicy' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar & Name */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.white} />
          </View>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email || user?.phone || ''}</Text>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.menu}>
          {menuItems.map((item, index) => (
            <Pressable key={item.labelKey} style={styles.menuItem}>
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.version}>{t('profile.version', { version: '0.1.0' })}</Text>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.md },
  email: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.xs },
  editBtn: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: colors.primary },
  editBtnText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.primary },
  menu: { backgroundColor: colors.white, borderRadius: radii.xl, overflow: 'hidden', elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  menuLabel: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.lg },
  logoutText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.error },
  version: { fontSize: typography.sizes.xs, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
});
