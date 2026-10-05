import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { LucideIcon } from 'lucide-react-native';

export type StatusChipProps = {
  icon: LucideIcon;
  label: string;
  /** F-01 draws every status in primary and lets the glyph carry the difference. */
  color?: ColorToken;
  /** The caller supplies it, because only the caller knows what the status is of. */
  accessibilityLabel?: string;
};

const ICON_SIZE = 16;

/**
 * Status as a glyph beside a word, never as colour alone (SYSTEM-SPEC §6.2). No border and no
 * tint: the frame samples 1A6B3C on all four states, so the icon is the whole distinction.
 */
export function StatusChip({
  icon: Icon,
  label,
  color = 'primary',
  accessibilityLabel,
}: StatusChipProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {/* Leading, so row-reverse puts it to the right of the label as the frame draws it. */}
      <Icon size={ICON_SIZE} color={colors[color]} />

      <Text variant="label14" color={color}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
});
