import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/colors';

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.paymentMethods')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.empty}>
        <Ionicons name="card-outline" size={64} color={colors.border} />
        <Text style={styles.emptyTitle}>{t('payment.noMethods')}</Text>
        <Text style={styles.emptyMessage}>{t('payment.noMethodsMessage')}</Text>
        <Pressable style={styles.addBtn}>
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.addBtnText}>{t('payment.addMethod')}</Text>
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg },
  emptyMessage: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl,
    backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radii.full,
  },
  addBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.white },
});
