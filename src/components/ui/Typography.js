import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../constants/theme';

const Typography = ({
  variant = 'body1',
  color = 'primary',
  align = 'left',
  weight = 'regular',
  children,
  style,
  numberOfLines,
  ...props
}) => {
  const textStyles = [
    styles.base,
    styles[variant],
    styles[`color_${color}`],
    styles[`align_${align}`],
    styles[`weight_${weight}`],
    style,
  ];

  return (
    <Text
      style={textStyles}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamily.regular,
  },
  
  // Variants
  h1: {
    fontSize: typography.fontSize['4xl'],
    lineHeight: typography.lineHeight['4xl'],
    fontFamily: typography.fontFamily.bold,
  },
  h2: {
    fontSize: typography.fontSize['3xl'],
    lineHeight: typography.lineHeight['3xl'],
    fontFamily: typography.fontFamily.bold,
  },
  h3: {
    fontSize: typography.fontSize['2xl'],
    lineHeight: typography.lineHeight['2xl'],
    fontFamily: typography.fontFamily.semiBold,
  },
  h4: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontFamily: typography.fontFamily.semiBold,
  },
  h5: {
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
    fontFamily: typography.fontFamily.medium,
  },
  h6: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontFamily: typography.fontFamily.medium,
  },
  body1: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
  },
  body2: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  
  // Colors
  color_primary: {
    color: colors.text.primary,
  },
  color_secondary: {
    color: colors.text.secondary,
  },
  color_tertiary: {
    color: colors.text.tertiary,
  },
  color_inverse: {
    color: colors.text.inverse,
  },
  color_success: {
    color: colors.success,
  },
  color_warning: {
    color: colors.warning,
  },
  color_error: {
    color: colors.error,
  },
  color_info: {
    color: colors.info,
  },
  
  // Alignment
  align_left: {
    textAlign: 'left',
  },
  align_center: {
    textAlign: 'center',
  },
  align_right: {
    textAlign: 'right',
  },
  
  // Weight
  weight_light: {
    fontFamily: typography.fontFamily.light,
  },
  weight_regular: {
    fontFamily: typography.fontFamily.regular,
  },
  weight_medium: {
    fontFamily: typography.fontFamily.medium,
  },
  weight_semiBold: {
    fontFamily: typography.fontFamily.semiBold,
  },
  weight_bold: {
    fontFamily: typography.fontFamily.bold,
  },
});

export default Typography;