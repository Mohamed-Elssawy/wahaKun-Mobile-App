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
  /** Trailing arrow for next and submit. Points left because the UI is RTL. */
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
          <Text variant="label16Bold" color={labelColor}>
            {label}
          </Text>
          {icon}
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
    paddingVertical: spacing[8],
    gap: spacing[10],
  },
  inactivePrimary: {
    // Pale fill + muted label rather than grey fill + white label. White on N400
    // is 2.13:1 — 1.4.3 exempts disabled controls, but this app is read in direct
    // sun, so the exemption is not a reason to ship something illegible.
    backgroundColor: colors.surfaceMuted,
  },
  inactiveOther: {
    opacity: 0.5,
  },
});
