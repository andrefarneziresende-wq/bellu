import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/colors';
import { api } from '../services/api';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user?: { name: string; avatar?: string };
}

export default function ReviewsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: any }>('/reviews/my');
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.reviews ?? [];
      setReviews(list);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchReviews(); }, [fetchReviews]));

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color={i < rating ? colors.accent : colors.border}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('professional.reviews', 'Avaliações')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="star-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('pro.reviews.empty', 'Nenhuma avaliação ainda')}</Text>
          <Text style={styles.emptyText}>{t('pro.reviews.emptyMessage', 'Suas avaliações aparecerão aqui.')}</Text>
        </View>
      ) : (
        <>
          <View style={styles.summary}>
            <Text style={styles.avgRating}>{avgRating}</Text>
            <View style={styles.starsRow}>{renderStars(Math.round(Number(avgRating)))}</View>
            <Text style={styles.reviewCount}>
              {reviews.length} {t('pro.reviews.count', 'avaliações')}
            </Text>
          </View>
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(index * 60)}>
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewerName}>{item.user?.name || t('pro.reviews.anonymous', 'Anônimo')}</Text>
                    <View style={styles.starsRow}>{renderStars(item.rating)}</View>
                  </View>
                  {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
                  <Text style={styles.date}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Animated.View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  summary: { alignItems: 'center', paddingVertical: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  avgRating: { fontSize: 48, fontWeight: '700', color: colors.text },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewCount: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm },
  list: { padding: spacing.lg, paddingBottom: 100 },
  reviewCard: {
    backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 16, fontWeight: '600', color: colors.text },
  comment: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
