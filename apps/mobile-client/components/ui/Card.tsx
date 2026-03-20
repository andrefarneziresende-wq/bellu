import React, { type ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radii, spacing } from '../../theme/colors';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  animationDelay?: number;
}

export function Card({
  children,
  onPress,
  style,
  padding = spacing.lg,
  animationDelay = 0,
}: CardProps) {
  const content = (
    <Animated.View
      entering={FadeInDown.delay(animationDelay).duration(400).springify()}
      style={[styles.card, { padding }, style]}
    >
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
});
