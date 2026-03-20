export const colors = {
  primary: '#C4918E',
  primaryLight: '#D4A59F',
  primaryDark: '#A87A77',
  background: '#FAF7F5',
  accent: '#D4A574',
  accentLight: '#E0BB8E',
  text: '#3D2C29',
  textSecondary: '#8C7E7A',
  success: '#7D9B76',
  error: '#C75B5B',
  card: '#FFFFFF',
  border: '#E8E0DC',
  borderLight: '#F0EAE6',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(61, 44, 41, 0.5)',
  shadow: 'rgba(61, 44, 41, 0.08)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const fonts = {
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  bodySemiBold: 'DMSans-SemiBold',
  bodyBold: 'DMSans-Bold',
} as const;

export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLarge: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;
