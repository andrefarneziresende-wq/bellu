export const colors = {
  primary: '#C4918E',
  primaryLight: '#D4A5A2',
  primaryDark: '#A87875',
  background: '#FAF7F5',
  accent: '#D4A574',
  accentLight: '#E0BB92',
  text: '#3D2C29',
  textSecondary: '#8C7E7A',
  textTertiary: '#B5AAA7',
  success: '#7D9B76',
  error: '#C75B5B',
  warning: '#D4A574',
  card: '#FFFFFF',
  border: '#EDE8E5',
  borderLight: '#F5F0ED',
  shadow: 'rgba(61, 44, 41, 0.08)',
  shadowDark: 'rgba(61, 44, 41, 0.15)',
  overlay: 'rgba(61, 44, 41, 0.4)',
  skeleton: '#EDE8E5',
  skeletonHighlight: '#F5F0ED',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  tabBarInactive: '#B5AAA7',
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

export const typography = {
  fontFamily: 'DMSans',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;
