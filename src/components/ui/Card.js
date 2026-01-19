import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/theme';

const Card = ({
  children,
  style,
  onPress,
  variant = 'default',
  padding = 'medium',
  ...props
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    styles[padding],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.95}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Variants
  default: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  elevated: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  outlined: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0.05,
  },
  
  // Padding
  none: {
    padding: 0,
  },
  small: {
    padding: 12,
  },
  medium: {
    padding: 16,
  },
  large: {
    padding: 24,
  },
});

export default Card;