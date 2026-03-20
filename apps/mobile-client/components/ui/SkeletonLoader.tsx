import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../../theme/colors';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = radii.md, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 1]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as number, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={140} borderRadius={radii.lg} />
      <View style={styles.cardContent}>
        <Skeleton width={120} height={16} />
        <Skeleton width={180} height={12} style={{ marginTop: spacing.sm }} />
        <Skeleton width={80} height={12} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function ListItemSkeleton() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.listItemContent}>
        <Skeleton width={140} height={16} />
        <Skeleton width={100} height={12} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function CategorySkeleton() {
  return (
    <View style={styles.categoryItem}>
      <Skeleton width={64} height={64} borderRadius={radii.xl} />
      <Skeleton width={56} height={12} style={{ marginTop: spacing.sm }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.skeleton,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: 'hidden',
    width: 220,
    marginRight: spacing.md,
  },
  cardContent: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  listItemContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
});
