import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Dark navy theme matching the source app exactly
export const COLORS = {
  background: '#0c1426',
  card: '#1a233b',
  cardElevated: '#252f4a',
  primary: '#FFFFFF',
  primaryMuted: '#fafafa',
  accent: '#14b8a6',
  accentLight: '#2dd4bf',
  accentSecondary: '#f59e0b',
  accentSecondaryLight: '#fbbf24',
  emerald: '#10b981',
  muted: '#71717a',
  mutedLight: '#a1a1aa',
  mutedDark: '#52525b',
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  errorLight: '#ff6b6b',
  errorMuted: 'rgba(239, 68, 68, 0.3)',
};

export const GRADIENT = {
  colors: ['#14b8a6', '#10b981', '#f59e0b'] as const,
  start: { x: 0, y: 1 },
  end: { x: 1, y: 0 },
};

export const FONTS = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semibold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  serif: 'PlayfairDisplay-Regular',
  serifBold: 'PlayfairDisplay-Bold',
  serifItalic: 'PlayfairDisplay-Italic',
  serifBoldItalic: 'PlayfairDisplay-BoldItalic',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  display: 32,
  hero: 40,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const LAYOUT = {
  screenWidth: width,
  screenHeight: height,
  contentPadding: SPACING.lg,
  maxContentWidth: 400,
};
