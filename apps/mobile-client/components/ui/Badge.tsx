import React from 'react';
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, typography, spacing } from '../../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'error' | 'accent';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
  },
  default: {
    backgroundColor: colors.borderLight,
  },
  success: {
    backgroundColor: `${colors.success}20`,
  },
  error: {
    backgroundColor: `${colors.error}20`,
  },
  accent: {
    backgroundColor: `${colors.accent}20`,
  },
  size_sm: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  size_md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
  },
  text: {
    fontWeight: typography.weights.medium,
  },
  text_default: {
    color: colors.textSecondary,
  },
  text_success: {
    color: colors.success,
  },
  text_error: {
    color: colors.error,
  },
  text_accent: {
    color: colors.accent,
  },
  textSize_sm: {
    fontSize: typography.sizes.xs,
  },
  textSize_md: {
    fontSize: typography.sizes.sm,
  },
});
