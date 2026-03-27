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
        <View style={styles.iconCircle}>
          <Ionicons name="cash-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{t('payment.comingSoon', 'Em breve')}</Text>
        <Text style={styles.emptyMessage}>
          {t('payment.comingSoonMessage', 'O pagamento online estará disponível em breve. Por enquanto, o pagamento é feito diretamente no estabelecimento.')}
        </Text>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            {t('payment.inPersonInfo', 'Combine a forma de pagamento com o profissional no momento do atendimento.')}
          </Text>
        </View>
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
  iconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text, marginTop: spacing.xl },
  emptyMessage: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.xxl,
    backgroundColor: colors.primaryLight + '15', paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  infoText: { flex: 1, fontSize: typography.sizes.sm, color: colors.text, lineHeight: 18 },
});
