import { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  BrandTone,
  colors,
  floatingShadow,
  getInteractiveBorder,
  getInteractiveFill,
  radii,
  spacing,
} from '@/theme/theme';

type FloatingButtonProps = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  tone?: BrandTone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fillColor?: string;
  borderColor?: string;
  textColor?: string;
  size?: 'md' | 'lg' | 'hero';
  children?: React.ReactNode;
};

export function FloatingButton({
  title,
  subtitle,
  onPress,
  tone = 'green',
  disabled = false,
  style,
  fillColor,
  borderColor,
  textColor = colors.textOnBrand,
  size = 'md',
  children,
}: FloatingButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const backgroundColor = fillColor ?? getInteractiveFill(tone);
  const border = borderColor ?? getInteractiveBorder(tone);

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: value === 1 ? 6 : 0,
    }).start();
  };

  const paddingVertical = size === 'hero' ? spacing.xl : size === 'lg' ? spacing.lg : spacing.md;
  const titleSize = size === 'hero' ? 26 : size === 'lg' ? 18 : 16;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, disabled && styles.disabledWrap, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => !disabled && animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[
          styles.button,
          floatingShadow,
          {
            backgroundColor: disabled ? colors.mastery.locked : backgroundColor,
            borderColor: disabled ? colors.mastery.lockedBorder : border,
            paddingVertical,
          },
        ]}
      >
        {children ?? (
          <View style={styles.labelWrap}>
            <Text style={[styles.title, { fontSize: titleSize, color: disabled ? colors.textSecondary : textColor }]}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[styles.subtitle, { color: disabled ? colors.textSecondary : textColor, opacity: 0.9 }]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  disabledWrap: {
    opacity: 0.85,
  },
});