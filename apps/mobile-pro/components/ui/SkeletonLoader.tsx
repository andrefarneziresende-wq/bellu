import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../../theme/colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = radii.md,
  style,
}: SkeletonLoaderProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as number,
          height,
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
}

export function SkeletonCard({ lines = 3, showAvatar = false }: SkeletonCardProps) {
  return (
    <View style={styles.card}>
      {showAvatar && (
        <View style={styles.avatarRow}>
          <SkeletonLoader width={48} height={48} borderRadius={24} />
          <View style={styles.avatarText}>
            <SkeletonLoader width={120} height={16} />
            <SkeletonLoader width={80} height={12} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
          style={{ marginTop: i === 0 && !showAvatar ? 0 : spacing.sm }}
        />
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <SkeletonLoader width="50%" height={28} style={{ marginBottom: spacing.lg }} />
      <View style={styles.statsRow}>
        <SkeletonLoader width="48%" height={100} borderRadius={radii.xl} />
        <SkeletonLoader width="48%" height={100} borderRadius={radii.xl} />
      </View>
      <SkeletonLoader
        width="100%"
        height={100}
        borderRadius={radii.xl}
        style={{ marginTop: spacing.lg }}
      />
      <SkeletonLoader width="40%" height={22} style={{ marginTop: spacing.xxl }} />
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} showAvatar lines={2} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.border,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  dashboard: {
    padding: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
