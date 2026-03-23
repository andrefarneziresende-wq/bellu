import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/colors';
import { legalApi } from '../services/api';

type Tab = 'terms_of_use' | 'privacy_policy';

interface LegalContent {
  id: string;
  title: string;
  content: string;
  version: string;
}

export default function LegalScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('terms_of_use');
  const [termsData, setTermsData] = useState<LegalContent | null>(null);
  const [privacyData, setPrivacyData] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale = i18n.language || 'pt-BR';

  useEffect(() => {
    const fetchLegal = async () => {
      setLoading(true);
      setError(null);
      try {
        const [termsRes, privacyRes] = await Promise.all([
          legalApi.getByType('terms_of_use', locale),
          legalApi.getByType('privacy_policy', locale),
        ]);
        setTermsData(termsRes.data);
        setPrivacyData(privacyRes.data);
      } catch (err: any) {
        setError(err.message || t('errors.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchLegal();
  }, [locale]);

  const currentData = activeTab === 'terms_of_use' ? termsData : privacyData;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {activeTab === 'terms_of_use' ? t('profile.termsOfUse') : t('profile.privacyPolicy')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, activeTab === 'terms_of_use' && styles.tabActive]}
          onPress={() => setActiveTab('terms_of_use')}
        >
          <Text style={[styles.tabText, activeTab === 'terms_of_use' && styles.tabTextActive]}>
            {t('profile.termsOfUse')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'privacy_policy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy_policy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy_policy' && styles.tabTextActive]}>
            {t('profile.privacyPolicy')}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : currentData ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{currentData.title}</Text>
          <Text style={styles.version}>v{currentData.version}</Text>
          <Text style={styles.content}>{currentData.content}</Text>
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>{t('common.noResults')}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  content: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 22,
  },
});
