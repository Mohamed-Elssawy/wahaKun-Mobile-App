import { StyleSheet, TouchableOpacity } from 'react-native';

import type { Locale } from '@/i18n';
import { BackArrow, ForwardArrow } from '@/i18n/icons';
import {
  colors,
  controlHeight,
  radii,
  roleVariants,
  scriptFonts,
  scriptRoleVariants,
  spacing,
} from '@/theme';

import { ButtonSpinner } from './ButtonSpinner';
import { Text } from './Text';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shows a spinner and blocks presses. */
  loading?: boolean;
  disabled?: boolean;
  /** G-02's arrow, trailing the label. The glyph follows the locale. */
  showArrow?: boolean;
  /** The same slot pointed the other way, for a CTA that navigates backward. */
  showArrowEnd?: boolean;
  /** Descriptive icon, so it leads the label on the right. Directional ones use showArrow. */
  icon?: ReactNode;
  /** Icon after the label instead of before; F-02b's "Retake"/"Record again" only (C45). */
  iconTrails?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** The language the label is written in, when it is not the active one. S-12's relaunch only. */
  script?: Locale;
};

const VARIANT_STYLE: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
  },
  // C5: a fourth variant, not a tweak to secondary; borderControl alone carries WCAG 1.4.11's 3:1 here.
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderControl,
  },
  ghost: { backgroundColor: 'transparent' },
};

const VARIANT_LABEL_COLOR = {
  primary: 'textInverse',
  secondary: 'primary',
  outline: 'textPrimary',
  ghost: 'primary',
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  showArrow = false,
  showArrowEnd = false,
  icon,
  iconTrails = false,
  style,
  testID,
  script,
}: ButtonProps) {
  const isInactive = disabled || loading;
  const labelColor =
    isInactive && variant === 'primary' ? 'textMuted' : VARIANT_LABEL_COLOR[variant];
  // C38: a ghost label draws as a 14 link, not filled-button size, but it's still a button, so only the role changes.
  const labelRole = variant === 'ghost' ? 'ghostLabel' : 'buttonLabel';

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
        <ButtonSpinner color={labelColor} />
      ) : (
        <>
          {iconTrails ? null : icon}
          <Text
            // §16.6: the label's size follows its script - a Latin label is set one step larger.
            variant={(script ? scriptRoleVariants[script] : roleVariants)[labelRole]}
            color={labelColor}
            // A ghost label's family follows the active locale; in the other script it'd take a face that doesn't carry it (see StateScreen).
            style={
              script && variant === 'ghost'
                ? { fontFamily: scriptFonts[script].regular }
                : null
            }
          >
            {label}
          </Text>
          {iconTrails ? icon : null}
          {showArrow && <ForwardArrow size={24} color={colors[labelColor]} />}
          {showArrowEnd && <BackArrow size={24} color={colors[labelColor]} />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    // The icon leads and the arrow trails, which direction then mirrors for free.
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // minHeight, not height: a fixed 48 clips the label at large OS font sizes.
    minHeight: controlHeight,
    borderRadius: radii[6],
    paddingHorizontal: spacing[12],
    // 8+8 is the largest step that keeps a one-line label under controlHeight in either script (Button.test asserts it).
    paddingVertical: spacing[8],
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
