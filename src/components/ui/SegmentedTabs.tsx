import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { TextProps } from './Text';

/**
 * 'seated' is F-07: on the canvas, a hairline under it, the rule spanning the column.
 * 'floating' is F-01: no fill, no rule, the rule only as wide as the word.
 */
// One prop rather than six: the fill, the padding, the type step and the rule's width all
// change together between the two frames, and no third combination is drawn anywhere.
export type SegmentedTabsVariant = 'seated' | 'floating';

export type SegmentedTabsProps<K extends string> = {
  /** Counts belong in the label - only the caller knows what it is counting. */
  items: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  variant?: SegmentedTabsVariant;
};

const UNDERLINE_HEIGHT = 2;

/** Under Android's 48dp target, which is what the frame draws; hitSlop is not available here. */
const FLOATING_TAB_HEIGHT = 44;

// S-6: every tab label is h5, active and inactive alike - the two states differ by colour
// and the underline only, never by size or weight.
function labelVariant(): TextProps['variant'] {
  return 'h5';
}

function labelColor(variant: SegmentedTabsVariant, isActive: boolean): ColorToken {
  if (isActive) {
    return 'primary';
  }
  // N700 on F-07, where an unselected tab is still a control to read; N650 on F-01.
  return variant === 'floating' ? 'textMuted' : 'textSecondary';
}

/** The single-select tab row above a list. F-01 and F-07 draw the same control. */
export function SegmentedTabs<K extends string>({
  items,
  value,
  onChange,
  variant = 'seated',
}: SegmentedTabsProps<K>) {
  const isFloating = variant === 'floating';

  return (
    <View
      // row-reverse: the first tab is الكل and belongs at the right.
      style={[styles.row, isFloating ? styles.rowFloating : styles.rowSeated]}
      accessibilityRole="tablist"
    >
      {items.map(item => {
        const isActive = item.key === value;

        const content = (
          <>
            {/* h5 is wider than the old per-state sizing (Cairo-SemiBold, not NotoSansArabic) -
                a two-word label in a five-tab row (E-01's قيد المراجعة) can outgrow its
                column. Shrink-to-fit on one line rather than let it wrap and stack. */}
            <Text
              variant={labelVariant()}
              color={labelColor(variant, isActive)}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.label}
            </Text>

            {/* Always rendered so selecting a tab cannot change the row's height. */}
            <View
              style={[
                styles.underline,
                isFloating ? styles.underlineWord : styles.underlineColumn,
                isActive && styles.underlineActive,
              ]}
            />
          </>
        );

        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, isFloating ? styles.tabFloating : styles.tabSeated]}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {/* The wrapper is what lets the rule stretch to the word rather than to the
                share of the row the tab occupies. */}
            {isFloating ? <View style={styles.inner}>{content}</View> : content}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
  },
  rowSeated: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFloating: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
  },
  // Equal shares rather than intrinsic width, which is what spreads them across the row.
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabSeated: {
    gap: spacing[8],
    paddingTop: spacing[12],
  },
  tabFloating: {
    minHeight: FLOATING_TAB_HEIGHT,
  },
  inner: {
    alignItems: 'center',
    gap: spacing[8],
    // The rule overhangs the word by this much on each side in the frame.
    paddingHorizontal: spacing[4],
  },
  underline: {
    height: UNDERLINE_HEIGHT,
  },
  underlineColumn: {
    // Narrower than the tab so the rule sits under the word, not the column.
    width: '70%',
    backgroundColor: colors.background,
  },
  underlineWord: {
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  underlineActive: {
    backgroundColor: colors.primary,
  },
});
