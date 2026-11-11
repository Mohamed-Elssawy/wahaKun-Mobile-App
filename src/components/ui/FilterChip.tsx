import { StyleSheet, TouchableOpacity } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

import type { ReactNode } from 'react';

export type FilterChipProps = {
  label: string;
  isActive?: boolean;
  onPress: () => void;
  /** Trails the label on the left, where the frame puts the sort chip's chevron. */
  trailing?: ReactNode;
  accessibilityLabel?: string;
};

// 36 in the frame. Under Android's 48dp target, so the shortfall goes into hitSlop.
const HEIGHT = 36;
const TOUCH_PADDING = 6;

/** One pill in the row under the tabs. A toggle for a filter, a menu for a sort. */
export function FilterChip({
  label,
  isActive = false,
  onPress,
  trailing,
  accessibilityLabel,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={onPress}
      hitSlop={{ top: TOUCH_PADDING, bottom: TOUCH_PADDING }}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text variant="label14" color={isActive ? 'textInverse' : 'textStrong'}>
        {label}
      </Text>
      {trailing}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: HEIGHT,
    paddingHorizontal: spacing[16],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    // borderControl, not the N400 the frame samples: a chip is a control, so 1.4.11 wants 3:1.
    borderColor: colors.borderControl,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
