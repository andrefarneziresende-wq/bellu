import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radii, spacing, shadows } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  animated?: boolean;
  delay?: number;
}

export function Card({
  children,
  style,
  padding = 'lg',
  animated = true,
  delay = 0,
}: CardProps) {
  const content = (
    <View style={[styles.card, { padding: spacing[padding] }, style]}>
      {children}
    </View>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    ...shadows.card,
  },
});
