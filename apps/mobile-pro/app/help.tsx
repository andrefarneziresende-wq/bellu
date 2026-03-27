import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/colors';

export default function HelpScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = [
    { icon: 'chatbubble-ellipses-outline' as const, label: t('help.faq', 'Perguntas frequentes'), onPress: () => {} },
    { icon: 'mail-outline' as const, label: t('help.contactEmail', 'Contato por e-mail'), onPress: () => Linking.openURL('mailto:suporte@bellu.com') },
    { icon: 'logo-whatsapp' as const, label: t('help.contactWhatsapp', 'Contato por WhatsApp'), onPress: () => Linking.openURL('https://wa.me/5511999999999') },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.helpSupport', 'Ajuda e Suporte')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.list}>
        {items.map((item, i) => (
          <Pressable key={i} style={styles.row} onPress={item.onPress}>
            <Ionicons name={item.icon} size={22} color={colors.text} />
            <Text style={styles.label}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  list: {
    backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    borderRadius: radii.xl, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md,
  },
  label: { flex: 1, fontSize: 16, color: colors.text },
});
