import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/colors';

const languages = [
  { code: 'pt-BR', label: 'Portugues (Brasil)', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es-ES', label: 'Espanol', flag: '🇪🇸' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('profile.language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.list}>
        {languages.map((lang) => {
          const isActive = i18n.language === lang.code;
          return (
            <Pressable key={lang.code} style={styles.row} onPress={() => handleSelect(lang.code)}>
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{lang.label}</Text>
              {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
            </Pressable>
          );
        })}
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
  list: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: radii.xl, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md,
  },
  flag: { fontSize: 24 },
  label: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  labelActive: { fontWeight: typography.weights.semibold, color: colors.primary },
});
