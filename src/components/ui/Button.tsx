import { ArrowLeft } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

import { colors, controlHeight, radii, spacing } from '@/theme';

import { Text } from './Text';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  /**
   * Trailing arrow, matching the "next"/"submit" buttons throughout the
   * registration flow. Points left because the UI is right-to-left.
   */
  showArrow?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const VARIANT_STYLE: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: 'transparent' },
};

const VARIANT_LABEL_COLOR = {
  primary: 'textInverse',
  secondary: 'textPrimary',
  ghost: 'primary',
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  showArrow = false,
  icon,
  style,
  testID,
}: ButtonProps) {
  const isInactive = disabled || loading;
  const labelColor =
    isInactive && variant === 'primary' ? 'textInverse' : VARIANT_LABEL_COLOR[variant];

  return (
    <TouchableOpacity
      style={[
        styles.base,
        VARIANT_STYLE[variant],
        isInactive && variant === 'primary' && styles.inactivePrimary,
        isInactive && variant !== 'primary' && styles.inactiveOther,
        style,
      ]}
      onPress={onPress}
      activeOpacity={isInactive ? 1 : 0.7}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textInverse : colors.primary}
        />
      ) : (
        <>
          <Text variant="label16Bold" color={labelColor}>
            {label}
          </Text>
          {icon}
          {showArrow && (
            <ArrowLeft
              size={24}
              color={variant === 'primary' ? colors.textInverse : colors.primary}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    // row-reverse: label sits to the right of the arrow in an RTL layout.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: controlHeight,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.ms,
  },
  inactivePrimary: {
    backgroundColor: colors.disabled,
  },
  inactiveOther: {
    opacity: 0.5,
  },
});
