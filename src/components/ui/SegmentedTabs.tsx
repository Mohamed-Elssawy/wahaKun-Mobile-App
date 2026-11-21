import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { TextProps } from './Text';

/** seated is F-07 with a rule spanning the column, floating is F-01; no third exists. */
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

// S-6: every tab label is h5; the states differ by colour and the underline, never by size.
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
      // The first tab is الكل and belongs at the start edge.
      style={[styles.row, isFloating ? styles.rowFloating : styles.rowSeated]}
      accessibilityRole="tablist"
    >
      {items.map(item => {
        const isActive = item.key === value;

        const content = (
          <>
            {/* h5 is wider than the old per-state sizing; a two-word label (E-01's قيد المراجعة) can outgrow its column, so shrink-to-fit rather than wrap. */}
            <Text
              variant={labelVariant()}
              color={labelColor(variant, isActive)}
              numberOfLines={1}
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
            {/* Wrapper lets the rule stretch to the word, not to the tab's share of the row. */}
            {isFloating ? <View style={styles.inner}>{content}</View> : content}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // C64/C69: labels are spread, not shared out - each tab is as wide as its words, so "Under review" and "قيد المراجعة" fit where an equal fifth of 390dp couldn't.
  rowSeated: {
    backgroundColor: colors.background,
    paddingHorizontal: screenPadding,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowFloating: {
    paddingHorizontal: screenPadding,
    paddingTop: spacing[16],
  },
  tab: {
    alignItems: 'center',
  },
  // Intrinsic width sets the tab; only once the row is genuinely full does minimumFontScale shrink the label instead of a tab falling off the edge.
  tabSeated: {
    flexShrink: 1,
    gap: spacing[8],
    paddingTop: spacing[12],
  },
  // F-01 keeps equal shares, which is what its frame draws; only the seated row changed.
  tabFloating: {
    flex: 1,
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
  // The tab is the word now, so the rule stretches to it, not to 70% of a column share like before.
  underlineColumn: {
    alignSelf: 'stretch',
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
