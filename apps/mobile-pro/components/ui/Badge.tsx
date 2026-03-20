import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme/colors';

type BadgeVariant = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  style,
  textStyle,
}: BadgeProps) {
  const variantStyles = getVariantColors(variant);

  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: variantStyles.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'md' && styles.textMd,
          { color: variantStyles.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function getVariantColors(variant: BadgeVariant) {
  switch (variant) {
    case 'confirmed':
      return { bg: `${colors.success}20`, text: colors.success };
    case 'pending':
      return { bg: `${colors.accent}20`, text: colors.accent };
    case 'completed':
      return { bg: `${colors.primary}20`, text: colors.primary };
    case 'cancelled':
      return { bg: `${colors.error}20`, text: colors.error };
    default:
      return { bg: colors.borderLight, text: colors.textSecondary };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  textMd: {
    fontSize: 13,
  },
});
