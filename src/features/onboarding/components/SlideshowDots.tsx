import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

export type SlideshowDotsProps = {
  count: number;
  /** 0-based. */
  activeIndex: number;
  /** 0-based. Omit to render the dots as non-interactive. */
  onSelect?: (index: number) => void;
};

const DOT_SIZE = 16;
const ACTIVE_WIDTH = 24;
const ACTIVE_HEIGHT = 12;
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

/** The active dot is a pill, not a bigger circle, which is how S-01a draws it. */
export function SlideshowDots({ count, activeIndex, onSelect }: SlideshowDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }, (_, index) => (
        // Position is the identity here: the dots never reorder.
        <TouchableOpacity
          key={index}
          disabled={!onSelect}
          onPress={() => onSelect?.(index)}
          hitSlop={HIT_SLOP}
          accessibilityRole={onSelect ? 'button' : undefined}
          accessibilityLabel={onSelect ? `الانتقال إلى الشريحة ${index + 1}` : undefined}
        >
          <View style={index === activeIndex ? styles.active : styles.dot} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // row-reverse: the first slide's dot sits on the right, and progress runs leftwards.
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[32],
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.borderStrong,
  },
  active: {
    width: ACTIVE_WIDTH,
    height: ACTIVE_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
