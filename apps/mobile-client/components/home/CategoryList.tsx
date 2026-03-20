import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { colors, radii, typography, spacing } from '../../theme/colors';
import { CategorySkeleton } from '../ui/SkeletonLoader';

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

const MOCK_CATEGORIES: CategoryItem[] = [
  { id: '1', name: 'Hair', icon: '💇‍♀️' },
  { id: '2', name: 'Nails', icon: '💅' },
  { id: '3', name: 'Skin', icon: '✨' },
  { id: '4', name: 'Makeup', icon: '💄' },
  { id: '5', name: 'Lashes', icon: '👁️' },
  { id: '6', name: 'Barber', icon: '💈' },
  { id: '7', name: 'Massage', icon: '💆‍♀️' },
  { id: '8', name: 'Waxing', icon: '🪒' },
];

interface CategoryListProps {
  isLoading?: boolean;
}

export function CategoryList({ isLoading = false }: CategoryListProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MOCK_CATEGORIES.map((category, index) => (
          <Animated.View
            key={category.id}
            entering={FadeInRight.delay(index * 60).duration(400)}
          >
            <TouchableOpacity
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => router.push(`/search?category=${category.id}`)}
            >
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{category.icon}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
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
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 72,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
