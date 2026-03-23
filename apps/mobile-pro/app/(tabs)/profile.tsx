import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, radii } from '../../theme/colors';
import { useAuthStore } from '../../stores/authStore';
import { Badge } from '../../components/ui/Badge';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const menuItems: { icon: IoniconsName; labelKey: string }[] = [
  { icon: 'storefront-outline', labelKey: 'pro.services.title' },
  { icon: 'time-outline', labelKey: 'professional.workingHours' },
  { icon: 'star-outline', labelKey: 'professional.reviews' },
  { icon: 'settings-outline', labelKey: 'profile.settings' },
  { icon: 'language-outline', labelKey: 'profile.language' },
  { icon: 'help-circle-outline', labelKey: 'profile.helpSupport' },
  { icon: 'document-text-outline', labelKey: 'profile.termsOfUse' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { professional, proContext, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirmation'),
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={36} color={colors.white} />
          </View>
          <Text style={styles.name}>{proContext?.businessName || professional?.salonName || professional?.name || ''}</Text>
          <Text style={styles.subtitle}>{professional?.name || ''}</Text>
          {proContext && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {proContext.type === 'owner' ? '👑 ' : ''}{proContext.roleName}
              </Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <Text style={styles.star}>★</Text>
            <Text style={styles.rating}>{professional?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.reviews}>({professional?.reviewCount || 0} {t('professional.reviews').toLowerCase()})</Text>
          </View>
          <Pressable style={styles.editBtn}>
            <Text style={styles.editBtnText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </Animated.View>

        {/* Menu */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable key={item.labelKey} style={styles.menuItem}>
              <Ionicons name={item.icon} size={22} color={colors.text} />
              <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.border} />
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
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  star: { color: colors.accent, fontSize: 16 },
  rating: { fontSize: 15, fontWeight: '700', color: colors.text },
  reviews: { fontSize: 13, color: colors.textSecondary },
  editBtn: { marginTop: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radii.full, borderWidth: 1, borderColor: colors.primary },
  editBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  roleBadge: { marginTop: spacing.sm, backgroundColor: colors.primaryLight + '30', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  menu: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden', elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.lg },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
