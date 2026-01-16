import { StyleSheet, Text } from 'react-native';

const TypographyComponents = ({ children, size = 'md', font = 'reg', other = '', style, align, color }) => {
  // Size mapping
  const sizeStyles = {
    'xs': styles.xs,
    'sm': styles.sm,
    'md': styles.md,
    'lg': styles.lg,
    'xl': styles.xl,
    '2xl': styles.xxl,
    '3xl': styles.xxxl,
    '4xl': styles.xxxxl,
  };

  // Font weight mapping
  const fontStyles = {
    'light': styles.light,
    'reg': styles.regular,
    'medium': styles.medium,
    'semi-bold': styles.semiBold,
    'bold': styles.bold,
  };

  // Combine all styles
  const combinedStyles = [
    styles.base,
    sizeStyles[size] || styles.md,
    fontStyles[font] || styles.regular,
    style,
  ];

  // Add text alignment
  if (align) {
    combinedStyles.push({ textAlign: align });
  }

  // Add direct color
  if (color) {
    combinedStyles.push({ color });
  }

  // Parse the 'other' prop for additional styling (tailwind-like classes)
  if (other) {
    const otherClasses = other.split(' ');
    otherClasses.forEach(cls => {
      if (cls.startsWith('text-')) {
        const color = cls.replace('text-', '');
        if (color.startsWith('gray-')) {
          const grayValue = color.replace('gray-', '');
          combinedStyles.push({ color: `#${GRAY_SCALE[grayValue] || '6b7280'}` });
        } else if (COLOR_MAP[color]) {
          combinedStyles.push({ color: COLOR_MAP[color] });
        }
      } else if (cls.startsWith('mt-')) {
        const margin = parseInt(cls.replace('mt-', '')) * 4;
        combinedStyles.push({ marginTop: margin });
      } else if (cls.startsWith('mb-')) {
        const margin = parseInt(cls.replace('mb-', '')) * 4;
        combinedStyles.push({ marginBottom: margin });
      } else if (cls.startsWith('ml-')) {
        const margin = parseInt(cls.replace('ml-', '')) * 4;
        combinedStyles.push({ marginLeft: margin });
      } else if (cls.startsWith('mr-')) {
        const margin = parseInt(cls.replace('mr-', '')) * 4;
        combinedStyles.push({ marginRight: margin });
      }
    });
  }

  return (
    <Text style={combinedStyles}>
      {children}
    </Text>
  );
};

// Color mappings for tailwind-like classes
const GRAY_SCALE = {
  '50': 'f9fafb',
  '100': 'f3f4f6',
  '200': 'e5e7eb',
  '300': 'd1d5db',
  '400': '9ca3af',
  '500': '6b7280',
  '600': '4b5563',
  '700': '374151',
  '800': '1f2937',
  '900': '111827',
};

const COLOR_MAP = {
  'indigo-600': '#4f46e5',
  'red-500': '#ef4444',
  'green-500': '#10b981',
  'blue-500': '#3b82f6',
  'yellow-500': '#eab308',
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  // Sizes
  xs: { fontSize: 12 },
  sm: { fontSize: 14 },
  md: { fontSize: 16 },
  lg: { fontSize: 18 },
  xl: { fontSize: 20 },
  xxl: { fontSize: 24 },
  xxxl: { fontSize: 30 },
  xxxxl: { fontSize: 36 },
  // Font weights
  light: { fontWeight: '300' },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
});

export default TypographyComponents;