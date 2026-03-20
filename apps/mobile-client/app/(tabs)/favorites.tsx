import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme/colors';
import { Card } from '../../components/ui/Card';
import { favoritesApi } from '../../services/api';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await favoritesApi.list();
      setFavorites(res.data);
    } catch (error: any) {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleToggleFavorite = async (professionalId: string) => {
    try {
      await favoritesApi.add(professionalId);
      // Remove from local list since it's a toggle (unfavorite)
      setFavorites((prev) => prev.filter((f) => {
        const profId = f.professional?.id || f.id;
        return profId !== professionalId;
      }));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favorite');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>{t('favorites.title')}</Text>
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>{t('favorites.empty')}</Text>
          <Text style={styles.emptyMessage}>{t('favorites.emptyMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>{t('favorites.title')}</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          // The favorites API returns favorite records with nested professional
          const prof = item.professional || item;
          const professionalId = prof.id || item.professionalId;
          const name = prof.businessName || prof.name || '';
          const avatar = prof.avatarPhoto || prof.avatar || null;
          const rating = prof.rating ?? 0;
          const categoryName = prof.services?.[0]?.category?.translations?.[0]?.name || '';

          return (
            <Animated.View entering={FadeInDown.delay(100 + index * 80)}>
              <Pressable onPress={() => router.push(`/professional/${professionalId}`)}>
                <Card style={styles.favCard}>
                  <Image
                    source={{ uri: avatar || 'https://picsum.photos/seed/default/100/100' }}
                    style={styles.favImage}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.favInfo}>
                    <Text style={styles.favName}>{name}</Text>
                    <Text style={styles.favCategory}>{categoryName}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.star}>&#9733;</Text>
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                  </View>
                  <Pressable style={styles.heartBtn} onPress={() => handleToggleFavorite(professionalId)}>
                    <Ionicons name="heart" size={22} color={colors.error} />
                  </Pressable>
                </Card>
              </Pressable>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 100 },
  favCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, padding: spacing.md },
  favImage: { width: 64, height: 64, borderRadius: radii.lg },
  favInfo: { flex: 1, marginLeft: spacing.md },
  favName: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
  favCategory: { fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
  star: { color: colors.accent, fontSize: 14 },
  ratingText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  heartBtn: { padding: spacing.sm },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxxl },
  emptyTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: colors.text, marginTop: spacing.lg },
  emptyMessage: { fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
