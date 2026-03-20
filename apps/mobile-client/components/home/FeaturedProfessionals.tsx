import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, radii, typography, spacing } from '../../theme/colors';
import { Badge } from '../ui/Badge';
import { CardSkeleton } from '../ui/SkeletonLoader';

interface FeaturedProfessional {
  id: string;
  businessName: string;
  avatarPhoto: string | null;
  coverPhoto: string | null;
  rating: number;
  totalReviews: number;
  verified: boolean;
  category: string;
  distance: string;
}

const MOCK_PROFESSIONALS: FeaturedProfessional[] = [
  {
    id: '1',
    businessName: 'Studio Bella Rosa',
    avatarPhoto: null,
    coverPhoto: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
    rating: 4.9,
    totalReviews: 127,
    verified: true,
    category: 'Hair Salon',
    distance: '1.2 km',
  },
  {
    id: '2',
    businessName: 'Nail Art by Lucia',
    avatarPhoto: null,
    coverPhoto: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
    rating: 4.8,
    totalReviews: 89,
    verified: true,
    category: 'Nails',
    distance: '0.8 km',
  },
  {
    id: '3',
    businessName: 'Glow Skin Studio',
    avatarPhoto: null,
    coverPhoto: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400',
    rating: 4.7,
    totalReviews: 64,
    verified: false,
    category: 'Skincare',
    distance: '2.1 km',
  },
  {
    id: '4',
    businessName: 'MakeUp Pro',
    avatarPhoto: null,
    coverPhoto: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
    rating: 4.9,
    totalReviews: 203,
    verified: true,
    category: 'Makeup',
    distance: '3.5 km',
  },
];

interface FeaturedProfessionalsProps {
  isLoading?: boolean;
}

export function FeaturedProfessionals({ isLoading = false }: FeaturedProfessionalsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t('home.featured')}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_PROFESSIONALS.map((pro, index) => (
          <Animated.View
            key={pro.id}
            entering={FadeInRight.delay(index * 100).duration(400)}
          >
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/professional/${pro.id}`)}
            >
              <Image
                source={{ uri: pro.coverPhoto ?? undefined }}
                style={styles.coverImage}
                contentFit="cover"
                transition={300}
              />
              {pro.verified && (
                <View style={styles.verifiedBadge}>
                  <Badge label={t('professional.verified')} variant="success" />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.businessName} numberOfLines={1}>
                  {pro.businessName}
                </Text>
                <Text style={styles.category}>{pro.category}</Text>
                <View style={styles.row}>
                  <Text style={styles.rating}>{'★'} {pro.rating}</Text>
                  <Text style={styles.reviews}>
                    ({t('professional.reviewCount', { count: pro.totalReviews })})
                  </Text>
                </View>
                <Text style={styles.distance}>
                  {t('professional.distance', { distance: pro.distance })}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  seeAll: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: 220,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginRight: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 140,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  cardContent: {
    padding: spacing.md,
  },
  businessName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  category: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rating: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  reviews: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  distance: {
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
