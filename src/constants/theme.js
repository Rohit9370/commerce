export const colors = {
  // Primary colors - Modern blue gradient
  primary: '#4F46E5',
  primaryLight: '#7C3AED',
  primaryDark: '#3730A3',
  
  // Secondary colors - Vibrant teal
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  secondaryDark: '#0891B2',
  
  // Accent colors
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale - Warmer grays
  gray: {
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },
  
  // Background colors
  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Text colors
  text: {
    primary: '#1C1917',
    secondary: '#57534E',
    tertiary: '#78716C',
    inverse: '#FFFFFF',
    muted: '#A8A29E',
  },
  
  // Border colors
  border: {
    light: '#E7E5E4',
    medium: '#D6D3D1',
    dark: '#A8A29E',
  },
  
  // Status backgrounds
  statusBg: {
    success: '#ECFDF5',
    warning: '#FFFBEB',
    error: '#FEF2F2',
    info: '#EFF6FF',
  },
  
  // Gradient colors
  gradients: {
    primary: ['#4F46E5', '#7C3AED'],
    secondary: ['#06B6D4', '#22D3EE'],
    warm: ['#F59E0B', '#EF4444'],
    cool: ['#3B82F6', '#06B6D4'],
  },
};

export const typography = {
  fontFamily: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    semiBold: 'System',
    bold: 'System',
  },
  
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 19,
    '2xl': 22,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },
  
  lineHeight: {
    xs: 14,
    sm: 18,
    base: 22,
    lg: 24,
    xl: 28,
    '2xl': 32,
    '3xl': 36,
    '4xl': 42,
    '5xl': 48,
  },
  
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
  },
};

export const spacing = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
  '7xl': 64,
};

export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const shadows = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const layout = {
  window: {
    width: 375, // Base width for scaling
    height: 812, // Base height for scaling
  },
  
  header: {
    height: 56,
  },
  
  tabBar: {
    height: 60,
  },
  
  container: {
    paddingHorizontal: 16,
  },
};