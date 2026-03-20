import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { categoriesApi, professionalsApi } from '../../services/api';
import type { Professional, Category } from '@beauty/shared-types';

export default function SearchScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [results, setResults] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searched, setSearched] = useState(false);

  const getCategoryName = useCallback((cat: Category) => {
    const tr = cat.translations?.find((t) => t.locale === i18n.language);
    return tr?.name || cat.translations?.[0]?.name || cat.slug;
  }, [i18n.language]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res.data);
      } catch (_) {
        // Ignore
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        if (query.trim().length === 0) {
          setResults([]);
          setSearched(false);
        }
        return;
      }

      setLoading(true);
      setSearched(true);
      try {
        const res = await professionalsApi.search(query.trim());
        setResults(res.data);
      } catch (_) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const filterChips = categories.map((c) => ({ id: c.id, name: getCategoryName(c) }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </Animated.View>

      {/* Filter chips */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterChips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipList}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.chip, activeFilter === item.id && styles.chipActive]}
              onPress={() => setActiveFilter(activeFilter === item.id ? null : item.id)}
            >
              <Text style={[styles.chipText, activeFilter === item.id && styles.chipTextActive]}>{item.name}</Text>
            </Pressable>
          )}
        />
      </Animated.View>

      {/* Results */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {searched && (
            <Text style={styles.resultCount}>{t('search.results', { count: results.length })}</Text>
          )}
          {searched && results.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl }}>
              <Ionicons name="search-outline" size={64} color={colors.border} />
              <Text style={{ fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg }}>{t('search.noResults')}</Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(300 + index * 80)}>
                  <Pressable onPress={() => router.push(`/professional/${item.id}`)}>
                    <Card style={styles.resultCard}>
                      <Image source={{ uri: item.avatarPhoto || 'https://picsum.photos/seed/default/100/100' }} style={styles.resultImage} contentFit="cover" transition={200} />
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{item.businessName}</Text>
                        <Text style={styles.resultCategory}>{item.address}</Text>
                        <View style={styles.resultFooter}>
                          <View style={styles.ratingRow}>
                            <Text style={styles.star}>&#9733;</Text>
                            <Text style={styles.ratingText}>{item.rating?.toFixed(1) ?? '0.0'}</Text>
                            <Text style={styles.reviewCount}>({item.totalReviews ?? 0})</Text>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                </Animated.View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radii.lg, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingHorizontal: spacing.lg, height: 48, gap: spacing.sm, elevation: 2, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
  searchInput: { flex: 1, fontSize: typography.sizes.md, color: colors.text },
  chipList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.sizes.sm, color: colors.text, fontWeight: typography.weights.medium },
  chipTextActive: { color: colors.white },
  resultCount: { fontSize: typography.sizes.sm, color: colors.textSecondary, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  resultList: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  resultCard: { flexDirection: 'row', marginBottom: spacing.md, overflow: 'hidden' },
  resultImage: { width: 90, height: 90, borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg },
  resultInfo: { flex: 1, padding: spacing.md, justifyContent: 'center' },
  resultName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  resultCategory: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  resultFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  star: { color: colors.accent, fontSize: 14 },
  ratingText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  reviewCount: { fontSize: typography.sizes.xs, color: colors.textSecondary },
  price: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
});
