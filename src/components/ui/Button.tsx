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
  /** Directional icon, so it trails the label on the left. Points left because RTL. */
  showArrow?: boolean;
  /** Descriptive icon, so it leads the label on the right. Directional ones use showArrow. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const VARIANT_STYLE: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  ghost: { backgroundColor: 'transparent' },
};

const VARIANT_LABEL_COLOR = {
  primary: 'textInverse',
  secondary: 'textSecondary',
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
    isInactive && variant === 'primary' ? 'textMuted' : VARIANT_LABEL_COLOR[variant];

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
        // The inactive primary fill is pale now, so a white spinner would vanish.
        <ActivityIndicator color={colors[labelColor]} />
      ) : (
        <>
          {icon}
          <Text variant="h5" color={labelColor}>
            {label}
          </Text>
          {showArrow && <ArrowLeft size={24} color={colors[labelColor]} />}
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
    // minHeight, not height: a fixed 48 clips the label at large OS font sizes.
    minHeight: controlHeight,
    borderRadius: radii[6],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[12],
    gap: spacing[8],
  },
  inactivePrimary: {
    // Pale fill over grey: white on N400 is 2.13:1, and this app is read in direct sun.
    backgroundColor: colors.surfaceMuted,
  },
  inactiveOther: {
    opacity: 0.5,
  },
});
